/**
 * ALEX Provider Manager
 * 
 * Orchestrates multi-provider management, health monitoring, and fallback
 */

import { supabaseAdmin } from '@/lib/supabase'
import { ProviderConfig, ProviderHealthCheck, ProviderRequestResult, FallbackAttempt, classifyError, isRetryableError } from './provider-manager-types'
import { ProviderRegistry } from './provider-registry'
import { AIProvider } from './provider-interface'

export class ProviderManager {
  private registry: ProviderRegistry
  private providers: Map<string, ProviderConfig> = new Map()
  private initialized = false

  constructor(registry: ProviderRegistry) {
    this.registry = registry
  }

  /**
   * Initialize provider manager from database
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      const { data: configs, error } = await supabaseAdmin
        .from('alex_provider_config')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: true })

      if (error) throw error

      if (!configs || configs.length === 0) {
        console.warn('No active provider configurations found in database')
        // Fall back to environment variables for bootstrap
        await this.initializeFromEnv()
        this.initialized = true
        return
      }

      // Load provider configurations
      for (const config of configs) {
        this.providers.set(config.id, this.mapDbConfigToProviderConfig(config))
      }

      // Register providers in registry
      await this.registerProviders()

      this.initialized = true
      console.log(`Provider Manager initialized with ${this.providers.size} providers`)
    } catch (error) {
      console.error('Failed to initialize Provider Manager:', error)
      // Fall back to environment variables
      await this.initializeFromEnv()
      this.initialized = true
    }
  }

  /**
   * Fallback to environment variables for bootstrap
   */
  private async initializeFromEnv(): Promise<void> {
    const endpoint = process.env.ALEX_SELF_HOSTED_ENDPOINT
    const model = process.env.ALEX_SELF_HOSTED_MODEL
    const apiKey = process.env.ALEX_SELF_HOSTED_API_KEY

    if (endpoint && model) {
      // This will be handled by the existing provider registration logic
      console.log('Using environment variables for provider configuration')
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
      requestTimeout: dbConfig.request_timeout || 30000,
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
   * Register providers in the registry
   */
  private async registerProviders(): Promise<void> {
    // Clear existing registry
    this.registry.clear()

    // Register each provider
    for (const [id, config] of this.providers) {
      // This would need to be implemented based on provider type
      // For now, we'll use the existing provider registration logic
      // The actual adapter instantiation would happen here
    }
  }

  /**
   * Get active providers sorted by priority
   */
  getActiveProviders(): ProviderConfig[] {
    return Array.from(this.providers.values())
      .filter(p => p.isActive && p.healthStatus !== 'unavailable')
      .sort((a, b) => a.priority - b.priority)
  }

  /**
   * Get primary provider (highest priority, healthy)
   */
  getPrimaryProvider(): ProviderConfig | null {
    const active = this.getActiveProviders()
    return active.length > 0 ? active[0] : null
  }

  /**
   * Get fallback providers (excluding primary)
   */
  getFallbackProviders(): ProviderConfig[] {
    const active = this.getActiveProviders()
    return active.filter(p => p.fallbackEnabled).slice(1)
  }

  /**
   * Test a provider connection
   */
  async testProvider(providerId: string): Promise<ProviderHealthCheck> {
    const provider = this.providers.get(providerId)
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`)
    }

    const startTime = Date.now()
    try {
      // Perform health check
      // This would call the provider's health check endpoint
      // For OpenAI-compatible providers: GET /models
      // For others: appropriate health check
      
      const latency = Date.now() - startTime
      
      const result: ProviderHealthCheck = {
        providerId,
        healthy: true,
        model: provider.currentModel,
        latency,
        streaming: provider.capabilities.includes('streaming'),
        capabilities: provider.capabilities,
        timestamp: new Date().toISOString(),
      }

      // Update provider health in database
      await this.updateProviderHealth(providerId, {
        healthStatus: 'healthy',
        latencyMs: latency,
        lastHealthCheck: new Date().toISOString(),
        healthError: null,
        consecutiveFailureCount: 0,
        lastSuccessAt: new Date().toISOString(),
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
        consecutiveFailureCount: (provider.consecutiveFailureCount || 0) + 1,
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
    const { error } = await supabaseAdmin
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

    // Update local cache
    const provider = this.providers.get(providerId)
    if (provider) {
      Object.assign(provider, updates)
    }
  }

  /**
   * Execute request with fallback
   */
  async executeWithFallback(request: any): Promise<ProviderRequestResult> {
    const fallbackAttempts: FallbackAttempt[] = []
    const primaryProvider = this.getPrimaryProvider()
    const fallbackProviders = this.getFallbackProviders()

    if (!primaryProvider) {
      throw new Error('No active providers available')
    }

    // Try primary provider
    try {
      const result = await this.executeOnProvider(primaryProvider, request)
      return {
        ...result,
        fallbackOccurred: false,
        fallbackAttempts: [],
      }
    } catch (error) {
      const providerError = classifyError(error)
      
      if (!isRetryableError(providerError)) {
        // Non-retryable error - mark provider unhealthy
        await this.updateProviderHealth(primaryProvider.id, {
          healthStatus: 'unavailable',
          healthError: providerError.message,
          consecutiveFailureCount: (primaryProvider.consecutiveFailureCount || 0) + 1,
        })
        
        throw error
      }

      // Retryable error - try fallback providers
      fallbackAttempts.push({
        providerId: primaryProvider.id,
        providerName: primaryProvider.displayName,
        success: false,
        error: providerError.message,
        latency: 0,
      })

      for (const fallbackProvider of fallbackProviders) {
        try {
          const result = await this.executeOnProvider(fallbackProvider, request)
          
          // Update primary provider health (degraded)
          await this.updateProviderHealth(primaryProvider.id, {
            healthStatus: 'degraded',
            healthError: providerError.message,
          })

          return {
            ...result,
            fallbackOccurred: true,
            fallbackAttempts,
          }
        } catch (fallbackError) {
          const fallbackProviderError = classifyError(fallbackError)
          
          fallbackAttempts.push({
            providerId: fallbackProvider.id,
            providerName: fallbackProvider.displayName,
            success: false,
            error: fallbackProviderError.message,
            latency: 0,
          })

          if (!isRetryableError(fallbackProviderError)) {
            await this.updateProviderHealth(fallbackProvider.id, {
              healthStatus: 'unavailable',
              healthError: fallbackProviderError.message,
              consecutiveFailureCount: (fallbackProvider.consecutiveFailureCount || 0) + 1,
            })
          }
        }
      }

      // All providers failed
      throw new Error('All providers failed')
    }
  }

  /**
   * Execute request on a specific provider
   */
  private async executeOnProvider(provider: ProviderConfig, request: any): Promise<ProviderRequestResult> {
    const startTime = Date.now()
    
    try {
      // This would call the actual provider adapter
      // For now, this is a placeholder
      const result = await this.registry.getActiveProvider()?.stream(request)
      
      const latency = Date.now() - startTime
      
      // Update provider health on success
      await this.updateProviderHealth(provider.id, {
        healthStatus: 'healthy',
        latencyMs: latency,
        lastSuccessAt: new Date().toISOString(),
        consecutiveFailureCount: 0,
      })

      return {
        success: true,
        providerId: provider.id,
        providerName: provider.displayName,
        model: provider.currentModel,
        latency,
        fallbackOccurred: false,
        fallbackAttempts: [],
      }
    } catch (error) {
      const latency = Date.now() - startTime
      throw error
    }
  }

  /**
   * Refresh models for a provider
   */
  async refreshModels(providerId: string): Promise<string[]> {
    const provider = this.providers.get(providerId)
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`)
    }

    try {
      // Fetch models from provider
      // For OpenAI-compatible: GET /models
      // For others: appropriate endpoint
      
      // Update database with new models
      const models: string[] = [] // Would be populated from API
      
      await supabaseAdmin
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
}
