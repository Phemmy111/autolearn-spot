/**
 * ALEX Provider Manager
 * 
 * Orchestrates multi-provider management, health monitoring, and fallback
 */

import { supabaseUrl, supabaseServiceRoleKey, supabaseAdmin } from '@/lib/supabase'
import { ProviderConfig, ProviderHealthCheck, ProviderRequestResult, FallbackAttempt, classifyError, isRetryableError } from './provider-manager-types'
import { ProviderRegistry } from './provider-registry'
import { AIProvider, AIStreamEvent } from './provider-interface'
import { ProviderFactory } from './provider-factory'
import crypto from 'crypto'
import { currentUser } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

export class ProviderManager {
  private registry: ProviderRegistry

  // Encryption key (matching quiz system approach)
  private encryptionKey = process.env.ALEX_PROVIDER_ENCRYPTION_KEY || 'default-key-change-in-production-32bytes'

  constructor(registry: ProviderRegistry) {
    this.registry = registry
  }

  /**
   * Get encryption key (simple padding approach like quiz system)
   */
  private getEncryptionKey(): Buffer {
    const key = Buffer.from(this.encryptionKey.padEnd(32, '0').slice(0, 32))
    return key
  }

  /**
   * Get Supabase admin client (lazy initialization)
   */
  private getSupabaseAdmin() {
    if (!supabaseServiceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for provider management')
    }
    return createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }

  /**
   * Get Supabase admin client (lazy initialization)
   */
  private getSupabaseAdmin() {
    if (!supabaseServiceRoleKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for provider management')
    }
    return createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }

  /**
   * Decrypt API key
   */
  private decrypt(encrypted: string): string {
    try {
      const key = this.getEncryptionKey()
      const combined = Buffer.from(encrypted, 'base64')

      const iv = combined.slice(0, 16)
      const authTag = combined.slice(16, 32)
      const encryptedData = combined.slice(32)

      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
      decipher.setAuthTag(authTag)

      let decrypted = decipher.update(encryptedData)
      decrypted = Buffer.concat([decrypted, decipher.final()])

      return decrypted.toString('utf8')
    } catch (error) {
      console.error('ALEX Decryption error:', error)
      throw new Error('Failed to decrypt ALEX provider data')
    }
  }

  /**
   * Load and register providers from database
   * Called on each request to ensure configuration changes take effect immediately
   */
  async loadProviders(): Promise<void> {
    try {
      const { data: configs, error } = await this.getSupabaseAdmin()
        .from('alex_provider_config')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: true })

      if (error) throw error

      if (!configs || configs.length === 0) {
        console.warn('No active provider configurations found in database')
        // Fall back to environment variables for bootstrap
        await this.initializeFromEnv()
        return
      }

      // Clear existing registry to ensure fresh load
      this.registry.clear()

      // Load and register each provider
      for (const config of configs) {
        try {
          const providerConfig = this.mapDbConfigToProviderConfig(config)

          // Decrypt API key for the adapter
          const configWithDecryptedKey = {
            ...providerConfig,
            apiKeyEncrypted: this.decrypt(providerConfig.apiKeyEncrypted),
          }

          // Create adapter using factory
          const adapter = ProviderFactory.createProvider(configWithDecryptedKey)

          // Register in registry
          this.registry.registerProvider(adapter)

          console.log(`Loaded provider: ${providerConfig.displayName} (${providerConfig.providerType})`)
        } catch (error) {
          console.error(`Failed to load provider ${config.provider_name}:`, error)
        }
      }

      console.log(`Provider Manager loaded ${configs.length} providers from database`)
    } catch (error) {
      console.error('Failed to load providers from database:', error)
      // Fall back to environment variables
      await this.initializeFromEnv()
    }
  }

  /**
   * Fallback to environment variables for bootstrap
   */
  private async initializeFromEnv(): Promise<void> {
    const endpoint = process.env.ALEX_SELF_HOSTED_ENDPOINT
    const model = process.env.ALEX_SELF_HOSTED_MODEL
    const apiKey = process.env.ALEX_SELF_HOSTED_API_KEY

    if (endpoint && model && apiKey) {
      console.warn('Using environment variables for provider configuration (database empty)')
      // Import dynamically to avoid circular dependency
      const { SelfHostedProvider } = await import('./self-hosted-provider')
      const provider = new SelfHostedProvider({
        id: 'env-fallback',
        name: 'Environment Fallback Provider',
        endpoint,
        model,
        apiKey,
        priority: 999, // Lowest priority
        enabled: true,
      })
      this.registry.registerProvider(provider)
    } else {
      throw new Error('No provider configuration available - database is empty and environment variables not set')
    }
  }

  /**
   * Map database config to ProviderConfig type
   */
  private mapDbConfigToProviderConfig(dbConfig: any): ProviderConfig {
    return {
      id: dbConfig.id,
      providerName: dbConfig.provider_name,
      displayName: dbConfig.display_name || dbConfig.provider_name,
      providerType: dbConfig.provider_type,
      apiKeyEncrypted: dbConfig.api_key_encrypted,
      baseUrl: dbConfig.base_url,
      currentModel: dbConfig.current_model || (dbConfig.models && Object.keys(dbConfig.models)[0]),
      models: dbConfig.models,
      costControls: dbConfig.cost_controls,
      isActive: dbConfig.is_active,
      priority: dbConfig.priority || 1,
      healthStatus: dbConfig.health_status || 'unknown',
      lastHealthCheck: dbConfig.last_health_check,
      latencyMs: dbConfig.latency_ms,
      healthError: dbConfig.health_error,
      fallbackEnabled: dbConfig.fallback_enabled !== false,
      capabilities: dbConfig.capabilities || [],
      requestTimeout: dbConfig.request_timeout || 120000, // Increased from 30s to 2 minutes
      modelListMetadata: dbConfig.model_list_metadata || {},
      lastSuccessAt: dbConfig.last_success_at,
      failureCount: dbConfig.failure_count || 0,
      consecutiveFailureCount: dbConfig.consecutive_failure_count || 0,
      authType: dbConfig.auth_type || 'bearer',
      createdAt: dbConfig.created_at,
      updatedAt: dbConfig.updated_at,
    }
  }

  /**
   * Test a provider connection
   */
  async testProvider(providerId: string): Promise<ProviderHealthCheck> {
    // Reload providers to get current configuration
    await this.loadProviders()

    // Get provider config from database
    const { data: provider, error } = await this.getSupabaseAdmin()
      .from('alex_provider_config')
      .select('*')
      .eq('id', providerId)
      .single()

    if (error || !provider) {
      throw new Error(`Provider ${providerId} not found`)
    }

    const providerConfig = this.mapDbConfigToProviderConfig(provider)

    // Create adapter for testing
    const configWithDecryptedKey = {
      ...providerConfig,
      apiKeyEncrypted: this.decrypt(providerConfig.apiKeyEncrypted),
    }

    const adapter = ProviderFactory.createProvider(configWithDecryptedKey)

    const startTime = Date.now()
    try {
      // Perform health check using adapter
      const health = await adapter.healthCheck()

      const latency = Date.now() - startTime

      const result: ProviderHealthCheck = {
        providerId,
        healthy: health.status === 'healthy',
        model: providerConfig.currentModel,
        latency: health.latency || latency,
        streaming: providerConfig.capabilities.includes('streaming'),
        capabilities: providerConfig.capabilities,
        timestamp: new Date().toISOString(),
      }

      // Update provider health in database
      await this.updateProviderHealth(providerId, {
        healthStatus: health.status,
        latencyMs: health.latency || latency,
        lastHealthCheck: new Date().toISOString(),
        healthError: health.error,
        consecutiveFailureCount: health.status === 'healthy' ? 0 : (providerConfig.consecutiveFailureCount || 0) + 1,
        lastSuccessAt: health.status === 'healthy' ? new Date().toISOString() : providerConfig.lastSuccessAt,
      })

      return result
    } catch (error) {
      const latency = Date.now() - startTime

      const result: ProviderHealthCheck = {
        providerId,
        healthy: false,
        latency,
        streaming: false,
        capabilities: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }

      // Update provider health in database
      await this.updateProviderHealth(providerId, {
        healthStatus: 'unavailable',
        latencyMs: latency,
        lastHealthCheck: new Date().toISOString(),
        healthError: error instanceof Error ? error.message : 'Unknown error',
        consecutiveFailureCount: (providerConfig.consecutiveFailureCount || 0) + 1,
      })

      return result
    }
  }

  /**
   * Update provider health in database
   */
  private async updateProviderHealth(
    providerId: string,
    updates: Partial<ProviderConfig>
  ): Promise<void> {
    const { error } = await this.getSupabaseAdmin()
      .from('alex_provider_config')
      .update({
        health_status: updates.healthStatus,
        latency_ms: updates.latencyMs,
        last_health_check: updates.lastHealthCheck,
        health_error: updates.healthError,
        consecutive_failure_count: updates.consecutiveFailureCount,
        last_success_at: updates.lastSuccessAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', providerId)

    if (error) {
      console.error('Failed to update provider health:', error)
    }
  }

  /**
   * Log ALEX usage to database
   */
  private async logUsage(
    providerId: string,
    providerName: string,
    model: string,
    request: any,
    responseTimeMs: number,
    success: boolean,
    errorMessage?: string,
    tokensUsed?: number
  ): Promise<void> {
    try {
      const user = await currentUser()
      const userId = user?.id

      // Get conversation_id from request if available
      const conversationId = request.conversationId

      // Get provider type from database
      const { data: provider } = await this.getSupabaseAdmin()
        .from('alex_provider_config')
        .select('provider_type')
        .eq('id', providerId)
        .single()

      const providerType = provider?.provider_type || 'unknown'

      await this.getSupabaseAdmin().from('alex_usage').insert({
        user_id: userId || 'system',
        conversation_id: conversationId || null,
        model,
        tokens_used: tokensUsed || 0,
        estimated_cost: this.estimateCost(providerType, tokensUsed || 0),
        mode: request.mode || 'auto',
        created_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error logging ALEX usage:', error)
      // Don't throw - logging failures shouldn't break the main flow
    }
  }

  /**
   * Estimate cost based on provider and tokens
   * This is a simplified estimation - actual costs vary by model
   */
  private estimateCost(providerType: string, tokens: number): number {
    // Rough cost estimates per 1M tokens (input + output)
    const costPerMillionTokens: Record<string, number> = {
      groq: 0.59, // Llama 3 70B
      openrouter: 1.0, // Varies by model
      openai: 2.5, // GPT-4o-mini
      gemini: 0.5, // Gemini 1.5 Flash
      self_hosted: 0, // Self-hosted is free
      openai_compatible: 0, // Depends on server
    }

    const costPerToken = (costPerMillionTokens[providerType] || 1.0) / 1_000_000
    return tokens * costPerToken
  }

  /**
   * Execute request with fallback (non-streaming only)
   */
  async executeWithFallback(request: any): Promise<ProviderRequestResult> {
    const fallbackAttempts: FallbackAttempt[] = []

    // Reload providers to get current configuration
    await this.loadProviders()

    // Get active providers from registry
    const activeProviders = this.registry.getEnabledProviders()

    if (activeProviders.length === 0) {
      throw new Error('No active providers available')
    }

    // Try each provider in priority order
    for (const provider of activeProviders) {
      try {
        const result = await this.executeOnProvider(provider, request)
        return {
          ...result,
          fallbackOccurred: fallbackAttempts.length > 0,
          fallbackAttempts,
        }
      } catch (error) {
        const providerError = classifyError(error)

        // Log attempt
        fallbackAttempts.push({
          providerId: provider.id,
          providerName: provider.name,
          success: false,
          error: providerError.message,
          latency: 0,
        })

        // Update provider health
        if (!isRetryableError(providerError)) {
          await this.updateProviderHealth(provider.id, {
            healthStatus: 'unavailable',
            healthError: providerError.message,
            consecutiveFailureCount: 3, // Mark as unavailable immediately
          })
          // Non-retryable error - don't try more providers
          throw error
        }

        // Retryable error - mark as degraded and try next provider
        await this.updateProviderHealth(provider.id, {
          healthStatus: 'degraded',
          healthError: providerError.message,
          consecutiveFailureCount: 1,
        })
      }
    }

    // All providers failed
    throw new Error('All providers failed')
  }

  /**
   * Execute streaming request with fallback (returns generator)
   * This is called from AIEngine when no content has been emitted yet
   */
  async *executeStreamingWithFallback(request: any): AsyncGenerator<AIStreamEvent> {
    const fallbackAttempts: FallbackAttempt[] = []

    // Reload providers to get current configuration
    await this.loadProviders()

    // Get active providers from registry
    const activeProviders = this.registry.getEnabledProviders()

    if (activeProviders.length === 0) {
      throw new Error('No active providers available')
    }

    // Try each provider in priority order
    for (const provider of activeProviders) {
      try {
        let firstEvent = true
        for await (const event of provider.stream(request)) {
          yield event
          firstEvent = false
        }

        // Stream completed successfully
        return
      } catch (error) {
        const providerError = classifyError(error)

        // Log attempt
        fallbackAttempts.push({
          providerId: provider.id,
          providerName: provider.name,
          success: false,
          error: providerError.message,
          latency: 0,
        })

        // Update provider health
        if (!isRetryableError(providerError)) {
          await this.updateProviderHealth(provider.id, {
            healthStatus: 'unavailable',
            healthError: providerError.message,
            consecutiveFailureCount: 3,
          })
          // Non-retryable error - don't try more providers
          throw error
        }

        // Retryable error - mark as degraded and try next provider
        await this.updateProviderHealth(provider.id, {
          healthStatus: 'degraded',
          healthError: providerError.message,
          consecutiveFailureCount: 1,
        })
      }
    }

    // All providers failed
    throw new Error('All providers failed')
  }

  /**
   * Execute request on a specific provider
   */
  private async executeOnProvider(provider: AIProvider, request: any): Promise<ProviderRequestResult> {
    const startTime = Date.now()

    try {
      // Execute request through adapter
      const result = await provider.generate(request)

      const latency = Date.now() - startTime

      // Update provider health on success
      await this.updateProviderHealth(provider.id, {
        healthStatus: 'healthy',
        latencyMs: latency,
        lastSuccessAt: new Date().toISOString(),
        consecutiveFailureCount: 0,
      })

      // Log usage
      await this.logUsage(provider.id, provider.name, result.model, request, latency, true, undefined, result.usage?.totalTokens)

      return {
        success: true,
        providerId: provider.id,
        providerName: provider.name,
        model: result.model,
        latency,
        inputTokens: result.usage?.promptTokens,
        outputTokens: result.usage?.completionTokens,
        totalTokens: result.usage?.totalTokens,
        fallbackOccurred: false,
        fallbackAttempts: [],
      }
    } catch (error) {
      const latency = Date.now() - startTime

      // Log usage failure
      await this.logUsage(provider.id, provider.name, 'unknown', request, latency, false, error instanceof Error ? error.message : 'Unknown error')

      throw error
    }
  }

  /**
   * Refresh models for a provider
   */
  async refreshModels(providerId: string): Promise<string[]> {
    // Get provider config from database
    const { data: provider, error } = await this.getSupabaseAdmin()
      .from('alex_provider_config')
      .select('*')
      .eq('id', providerId)
      .single()

    if (error || !provider) {
      throw new Error(`Provider ${providerId} not found`)
    }

    try {
      // For Gemini, use default models list (no public API)
      if (provider.provider_type === 'gemini') {
        const defaultModels = [
          'gemini-1.5-pro',
          'gemini-1.5-flash',
          'gemini-1.0-pro',
          'gemini-pro',
          'gemini-pro-vision',
        ]

        await this.getSupabaseAdmin()
          .from('alex_provider_config')
          .update({
            models: { available: defaultModels },
            model_list_metadata: { lastRefreshed: new Date().toISOString() },
            updated_at: new Date().toISOString(),
          })
          .eq('id', providerId)

        return defaultModels
      }

      // For OpenAI-compatible providers, fetch from /models endpoint
      const baseUrl = provider.base_url || this.getDefaultBaseUrl(provider.provider_type)
      const headers = this.getAuthHeadersForProvider(provider)

      const response = await fetch(`${baseUrl}/models`, {
        headers,
        signal: AbortSignal.timeout(120000), // Increased from 30s to 2 minutes
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`)
      }

      const data = await response.json()
      const models = data.data?.map((m: any) => m.id) || []

      await this.getSupabaseAdmin()
        .from('alex_provider_config')
        .update({
          models: { available: models },
          model_list_metadata: { lastRefreshed: new Date().toISOString() },
          updated_at: new Date().toISOString(),
        })
        .eq('id', providerId)

      return models
    } catch (error) {
      console.error('Failed to refresh models:', error)
      throw error
    }
  }

  /**
   * Get auth headers for provider (simplified version for model discovery)
   */
  private getAuthHeadersForProvider(provider: any): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Decrypt API key if available
    if (provider.api_key_encrypted) {
      try {
        const apiKey = this.decrypt(provider.api_key_encrypted)

        if (provider.auth_type === 'bearer' && apiKey) {
          headers['Authorization'] = `Bearer ${apiKey}`
        } else if (provider.auth_type === 'api_key' && apiKey) {
          headers['Authorization'] = `Key ${apiKey}`
        } else if (provider.auth_type === 'custom' && apiKey) {
          headers['Authorization'] = apiKey
        }
      } catch (error) {
        console.error('Failed to decrypt API key for model discovery:', error)
      }
    }

    // Add OpenRouter-specific headers
    if (provider.provider_type === 'openrouter') {
      headers['HTTP-Referer'] = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      headers['X-Title'] = 'Autolearn ALEX'
    }

    return headers
  }

  /**
   * Get default base URL for provider type
   */
  private getDefaultBaseUrl(providerType: string): string {
    const defaults: Record<string, string> = {
      groq: 'https://api.groq.com/openai/v1',
      openrouter: 'https://openrouter.ai/api/v1',
      openai: 'https://api.openai.com/v1',
      openai_compatible: '',
      self_hosted: '',
    }
    return defaults[providerType] || ''
  }

  /**
   * Get auth headers for provider
   */
  private getAuthHeaders(provider: ProviderConfig): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    const apiKey = this.decrypt(provider.apiKeyEncrypted)

    if (provider.authType === 'bearer' && apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`
    } else if (provider.authType === 'api_key' && apiKey) {
      headers['Authorization'] = `Key ${apiKey}`
    } else if (provider.authType === 'custom' && apiKey) {
      headers['Authorization'] = apiKey
    }

    // Add OpenRouter-specific headers
    if (provider.providerType === 'openrouter') {
      headers['HTTP-Referer'] = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      headers['X-Title'] = 'Autolearn ALEX'
    }

    return headers
  }
}
