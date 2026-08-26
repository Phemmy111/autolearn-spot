/**
 * ALEX Provider Manager
 * 
 * Orchestrates multi-provider management, health monitoring, and fallback
 */


import { ProviderConfig, ProviderHealthCheck, ProviderRequestResult, FallbackAttempt, classifyError, isRetryableError } from './provider-manager-types'
import { ProviderRegistry } from './provider-registry'
import { AIProvider, AIStreamEvent, AIMessage } from './provider-interface'
import { estimateTokens, estimateMessageTokens, getTPMLimit } from '../token-estimation'
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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceRoleKey) {
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
    const exhaustedProviders = new Set<string>() // Track providers with exhausted quota

    console.log('[FALLBACK] executeWithFallback called')
    
    // Reload providers to get current configuration
    await this.loadProviders()

    // Get active providers from registry
    const activeProviders = this.registry.getEnabledProviders()

    console.log('[FALLBACK] Active providers for fallback:', activeProviders.map(p => ({
      id: p.id,
      name: p.name,
      priority: p.priority,
      type: p.type
    })))

    if (activeProviders.length === 0) {
      console.log('[FALLBACK] No active providers available')
      throw new Error('No active providers available')
    }

    // Try each provider in priority order
    for (const provider of activeProviders) {
      // Skip providers that have exhausted quota in this request
      if (exhaustedProviders.has(provider.id)) {
        console.log('[FALLBACK] Skipping exhausted provider:', provider.id, provider.name)
        continue
      }

      console.log('[FALLBACK] Attempting provider:', {
        id: provider.id,
        name: provider.name,
        priority: provider.priority,
        type: provider.type
      })
      
      try {
        const result = await this.executeOnProvider(provider, request)
        
        console.log('[FALLBACK] Provider succeeded:', {
          id: provider.id,
          name: provider.name,
          priority: provider.priority
        })
        
        return {
          ...result,
          fallbackOccurred: fallbackAttempts.length > 0,
          fallbackAttempts,
        }
      } catch (error) {
        const providerError = classifyError(error)

        console.log('[FALLBACK] Provider failed:', {
          id: provider.id,
          name: provider.name,
          priority: provider.priority,
          errorType: providerError.type,
          errorMessage: providerError.message,
          retryable: providerError.retryable,
          statusCode: providerError.statusCode
        })

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
          // Special handling for quota_exhausted - skip provider but continue fallback
          if (providerError.type === 'quota_exhausted') {
            console.log('[FALLBACK] Quota exhausted detected - skipping provider but continuing fallback:', provider.id)
            exhaustedProviders.add(provider.id) // Mark as exhausted for this request
            await this.updateProviderHealth(provider.id, {
              healthStatus: 'unavailable',
              healthError: providerError.message,
              consecutiveFailureCount: 3,
            })
            // Continue to next provider in the chain
            continue
          }
          
          console.log('[FALLBACK] Non-retryable error - stopping fallback chain:', providerError.type)
          await this.updateProviderHealth(provider.id, {
            healthStatus: 'unavailable',
            healthError: providerError.message,
            consecutiveFailureCount: 3, // Mark as unavailable immediately
          })
          // Non-retryable error - don't try more providers
          throw error
        }

        // Retryable error - mark as degraded and try next provider
        console.log('[FALLBACK] Retryable error - trying next provider')
        await this.updateProviderHealth(provider.id, {
          healthStatus: 'degraded',
          healthError: providerError.message,
          consecutiveFailureCount: 1,
        })
      }
    }

    // All providers failed
    console.log('[FALLBACK] All providers failed - throwing error')
    throw new Error('All providers failed')
  }

  /**
   * Estimate tokens for complete provider request including messages and tools
   */
  private estimateRequestTokens(request: any): number {
    let totalTokens = 0
    let messageTokens = 0
    let toolTokens = 0

    // Estimate tokens for messages
    if (request.messages && Array.isArray(request.messages)) {
      for (const message of request.messages) {
        // Handle both string and array content
        if (typeof message.content === 'string') {
          const msgTokens = estimateTokens(message.content)
          messageTokens += msgTokens
          totalTokens += msgTokens
        } else if (Array.isArray(message.content)) {
          // Multimodal content (text + images)
          for (const contentItem of message.content) {
            if (contentItem.type === 'text') {
              const textTokens = estimateTokens(contentItem.text)
              messageTokens += textTokens
              totalTokens += textTokens
            } else if (contentItem.type === 'image_url') {
              // Images are encoded as base64, estimate based on actual data size
              const imageUrl = contentItem.image_url?.url || ''
              if (imageUrl.startsWith('data:')) {
                // Estimate base64 image tokens: ~1 token per 4 characters of base64
                const base64Data = imageUrl.split(',')[1] || ''
                const imageTokens = Math.ceil(base64Data.length / 4)
                messageTokens += imageTokens
                totalTokens += imageTokens
              } else if (imageUrl.startsWith('placeholder://')) {
                // Placeholder fallback - should be rare after the fix
                messageTokens += 85
                totalTokens += 85
              } else {
                // URL-based image - use conservative estimate
                messageTokens += 85
                totalTokens += 85
              }
            }
          }
        }
        // Add small overhead per message
        totalTokens += 4
      }
    }

    // Estimate tokens for tool definitions
    if (request.tools && Array.isArray(request.tools)) {
      for (const tool of request.tools) {
        // Tool definition tokens
        const toolNameTokens = estimateTokens(tool.name)
        const toolDescTokens = estimateTokens(tool.description)
        const toolSchemaTokens = estimateTokens(JSON.stringify(tool.inputSchema))
        const toolTotal = toolNameTokens + toolDescTokens + toolSchemaTokens + 10
        toolTokens += toolTotal
        totalTokens += toolTotal
      }
    }

    console.log('[TPM Token Estimation] Breakdown:', {
      messageTokens,
      toolTokens,
      messageCount: request.messages?.length || 0,
      toolCount: request.tools?.length || 0,
      totalTokens,
      avgMessageTokens: request.messages?.length ? messageTokens / request.messages.length : 0
    })

    return totalTokens
  }

  /**
   * Check if a message contains attached file context
   * File context messages contain markers like "Attached Documents:" and reference material language
   */
  private isFileContextMessage(message: any): boolean {
    if (!message || typeof message.content !== 'string') {
      return false
    }
    const content = message.content
    return content.includes('Attached Documents:') && 
           content.includes('REFERENCE MATERIAL') &&
           content.includes('System instructions and user requests take priority')
  }

  /**
   * Check if request contains image content
   */
  private requestContainsImages(request: any): boolean {
    if (!request.messages || !Array.isArray(request.messages)) {
      return false
    }
    for (const message of request.messages) {
      if (Array.isArray(message.content)) {
        for (const contentItem of message.content) {
          if (contentItem.type === 'image_url') {
            return true
          }
        }
      }
    }
    return false
  }

  /**
   * Reduce request context to fit within TPM limit
   * Prioritizes system prompt, file context, and user message over conversation history
   */
  private reduceRequestForTPM(request: any, tpmLimit: number): any {
    const estimatedTokens = this.estimateRequestTokens(request)
    const hasImages = this.requestContainsImages(request)
    const safetyMargin = hasImages ? 0.7 : 0.8 // 70% for images, 80% for text-only
    const maxTokens = Math.floor(tpmLimit * safetyMargin)

    if (estimatedTokens <= maxTokens) {
      return request // No reduction needed
    }

    console.log('[TPM Gate] Request exceeds TPM limit, reducing context:', {
      estimatedTokens,
      maxTokens,
      tpmLimit,
      hasImages,
      safetyMargin,
      messageCount: request.messages?.length || 0,
      toolCount: request.tools?.length || 0
    })

    // Create a copy to avoid modifying original
    const reducedRequest = { ...request }
    reducedRequest.messages = [...(request.messages || [])]

    // Priority-based reduction:
    // 1. Never remove primary system prompt (first message without file context)
    // 2. Never remove file context system messages
    // 3. Never remove current user message (last message if role is 'user')
    // 4. Reduce conversation history first
    // 5. Remove tools if still too large
    // 6. Truncate user message content as last resort

    const lastMessage = reducedRequest.messages[reducedRequest.messages.length - 1]
    const isLastUserMessage = lastMessage?.role === 'user'

    // Identify protected vs removable messages
    const removableIndexes: number[] = []
    for (let i = 0; i < reducedRequest.messages.length; i++) {
      const message = reducedRequest.messages[i]
      
      // Skip last message (current user request)
      if (i === reducedRequest.messages.length - 1 && isLastUserMessage) {
        continue
      }
      
      // Skip file context messages
      if (this.isFileContextMessage(message)) {
        continue
      }
      
      // Skip primary system prompt (first message that's not file context)
      if (i === 0 && !this.isFileContextMessage(message)) {
        continue
      }
      
      // This message is removable (conversation history or other context)
      removableIndexes.push(i)
    }

    console.log('[TPM Gate] Removable message indexes:', removableIndexes)
    console.log('[TPM Gate] Protected file-context messages count:', 
      reducedRequest.messages.filter((m, i) => this.isFileContextMessage(m)).length
    )

    // Remove removable messages from oldest to newest
    for (const index of removableIndexes) {
      // Remove message at index (adjust for previous removals)
      const adjustedIndex = index - removableIndexes.indexOf(index)
      reducedRequest.messages.splice(adjustedIndex, 1)
      
      const newEstimate = this.estimateRequestTokens(reducedRequest)
      if (newEstimate <= maxTokens) {
        console.log('[TPM Gate] Reduced to fit TPM limit by removing removable context:', {
          newEstimate,
          maxTokens,
          removedIndex: index,
          messageCount: reducedRequest.messages.length,
          fileContextCount: reducedRequest.messages.filter((m, i) => this.isFileContextMessage(m)).length
        })
        return reducedRequest
      }
    }

    // If still too large, reduce tool definitions
    if (reducedRequest.tools && reducedRequest.tools.length > 0) {
      console.log('[TPM Gate] Removing tools to fit TPM limit')
      reducedRequest.tools = []
      
      const newEstimate = this.estimateRequestTokens(reducedRequest)
      if (newEstimate <= maxTokens) {
        console.log('[TPM Gate] Reduced to fit TPM limit by removing tools:', {
          newEstimate,
          maxTokens
        })
        return reducedRequest
      }
    }

    // If still too large, truncate user message content (last resort)
    if (isLastUserMessage && typeof lastMessage.content === 'string') {
      const currentLength = lastMessage.content.length
      const reductionRatio = maxTokens / estimatedTokens
      const newLength = Math.floor(currentLength * reductionRatio)
      
      reducedRequest.messages[reducedRequest.messages.length - 1] = {
        ...lastMessage,
        content: lastMessage.content.substring(0, newLength) + '... [truncated for TPM limit]'
      }
      
      const newEstimate = this.estimateRequestTokens(reducedRequest)
      console.log('[TPM Gate] Reduced user message to fit TPM limit:', {
        newEstimate,
        maxTokens,
        originalLength: currentLength,
        newLength
      })
      return reducedRequest
    }

    console.warn('[TPM Gate] Could not reduce request to fit TPM limit, may still fail')
    return reducedRequest
  }

  /**
   * Execute streaming request with fallback (returns generator)
   * This is called from AIEngine when no content has been emitted yet
   */
  async *executeStreamingWithFallback(request: any): AsyncGenerator<AIStreamEvent> {
    // Pass through disableTools and tools from request
    const enhancedRequest = {
      ...request,
      // disableTools is passed through from caller
    };
    const fallbackAttempts: FallbackAttempt[] = []
    const exhaustedProviders = new Set<string>() // Track providers with exhausted quota

    console.log('[FALLBACK] executeStreamingWithFallback called')
    console.log('[ToolDebug] request_has_tools:', !!request.tools)
    console.log('[ToolDebug] request_tools_count:', request.tools?.length || 0)
    console.log('[ToolDebug] request_disableTools:', request.disableTools)

    // Reload providers to get current configuration
    await this.loadProviders()

    // Get active providers from registry
    const activeProviders = this.registry.getEnabledProviders()

    console.log('[FALLBACK] Active providers for fallback:', activeProviders.map(p => ({
      id: p.id,
      name: p.name,
      priority: p.priority,
      type: p.type
    })))

    if (activeProviders.length === 0) {
      console.log('[FALLBACK] No active providers available')
      throw new Error('No active providers available')
    }

    // Try each provider in priority order
    for (const provider of activeProviders) {
      // Skip providers that have exhausted quota in this request
      if (exhaustedProviders.has(provider.id)) {
        console.log('[FALLBACK] Skipping exhausted provider:', provider.id, provider.name)
        continue
      }

      console.log('[FALLBACK] Attempting provider:', {
        id: provider.id,
        name: provider.name,
        priority: provider.priority,
        type: provider.type
      })

      console.log('[ToolDebug] provider:', provider.name)
      console.log('[ToolDebug] model:', enhancedRequest.model)
      console.log('[ToolDebug] request_has_tools:', !!enhancedRequest.tools)
      console.log('[ToolDebug] request_disableTools:', enhancedRequest.disableTools)

      // FINAL TPM SAFETY GATE - Check actual request before sending to provider
      const model = enhancedRequest.model || provider.config?.currentModel || 'default'
      const tpmLimit = getTPMLimit(model)
      const estimatedTokens = this.estimateRequestTokens(enhancedRequest)
      
      // Use more conservative safety margin for image requests due to provider tokenization variance
      const hasImages = this.requestContainsImages(enhancedRequest)
      const safetyMargin = hasImages ? 0.7 : 0.8 // 70% for images, 80% for text-only
      const maxTokens = Math.floor(tpmLimit * safetyMargin)

      console.log('[ATTACHMENT TRACE] TPM Gate Final request check:', {
        provider: provider.name,
        model,
        tpmLimit,
        maxTokens,
        estimatedTokens,
        messageCount: enhancedRequest.messages?.length || 0,
        toolCount: enhancedRequest.tools?.length || 0,
        hasImages,
        safetyMargin,
        willExceed: estimatedTokens > maxTokens
      })

      console.log('[ATTACHMENT TRACE] Message details:', {
        messages: enhancedRequest.messages?.map(m => ({
          role: m.role,
          contentLength: typeof m.content === 'string' ? m.content.length : 'multimodal',
          hasFileContext: typeof m.content === 'string' && m.content.includes('Attached Documents'),
          hasImage: Array.isArray(m.content) && m.content.some(c => c.type === 'image_url'),
          contentPreview: typeof m.content === 'string' ? m.content.substring(0, 150) : 'multimodal'
        }))
      })

      // Apply TPM reduction if needed
      const finalRequest = this.reduceRequestForTPM(enhancedRequest, tpmLimit)

      // Final hard TPM validation - ensure request cannot exceed provider-safe budget
      const finalEstimatedTokens = this.estimateRequestTokens(finalRequest)
      const finalMaxTokens = Math.floor(tpmLimit * safetyMargin)
      
      if (finalEstimatedTokens > finalMaxTokens) {
        console.error('[TPM Gate] FINAL VALIDATION FAILED - Request still exceeds safe provider budget:', {
          provider: provider.name,
          model,
          tpmLimit,
          finalMaxTokens,
          finalEstimatedTokens,
          excessTokens: finalEstimatedTokens - finalMaxTokens
        })
        
        // Perform emergency truncation as last resort - truncate user message
        const lastMessage = finalRequest.messages[finalRequest.messages.length - 1]
        if (lastMessage?.role === 'user' && typeof lastMessage.content === 'string') {
          const reductionRatio = finalMaxTokens / finalEstimatedTokens
          const newLength = Math.floor(lastMessage.content.length * reductionRatio)
          finalRequest.messages[finalRequest.messages.length - 1] = {
            ...lastMessage,
            content: lastMessage.content.substring(0, newLength) + '... [truncated to meet TPM limit]'
          }
          
          const retriedEstimate = this.estimateRequestTokens(finalRequest)
          console.log('[TPM Gate] Emergency user message truncation applied:', {
            originalLength: lastMessage.content.length,
            newLength,
            originalTokens: finalEstimatedTokens,
            retriedTokens: retriedEstimate,
            finalMaxTokens
          })
          
          if (retriedEstimate > finalMaxTokens) {
            console.error('[TPM Gate] EMERGENCY TRUNCATION FAILED - Request still exceeds limit, blocking provider call')
            throw new Error(`Request cannot be reduced to meet provider TPM limit of ${tpmLimit}. Request size: ${retriedEstimate} tokens, safe limit: ${finalMaxTokens} tokens.`)
          }
        } else {
          console.error('[TPM Gate] Cannot perform emergency truncation - blocking provider call')
          throw new Error(`Request cannot be reduced to meet provider TPM limit of ${tpmLimit}. Request size: ${finalEstimatedTokens} tokens, safe limit: ${finalMaxTokens} tokens.`)
        }
      } else {
        console.log('[TPM Gate] Final validation passed - request within safe provider budget:', {
          provider: provider.name,
          finalEstimatedTokens,
          finalMaxTokens,
          withinBudget: true
        })
      }

      try {
        let firstEvent = true
        for await (const event of provider.stream(finalRequest)) {
          if (event.type === 'tool_call') {
            console.log('[ToolDebug] tool_call_received from provider:', event.data.toolCall.toolName)
          }
          yield event
          firstEvent = false
        }

        // Stream completed successfully
        console.log('[FALLBACK] Provider succeeded:', {
          id: provider.id,
          name: provider.name,
          priority: provider.priority
        })
        return
      } catch (error) {
        const providerError = classifyError(error)

        console.log('[FALLBACK] Provider failed:', {
          id: provider.id,
          name: provider.name,
          priority: provider.priority,
          errorType: providerError.type,
          errorMessage: providerError.message,
          retryable: providerError.retryable,
          statusCode: providerError.statusCode
        })

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
          // Special handling for quota_exhausted - skip provider but continue fallback
          if (providerError.type === 'quota_exhausted') {
            console.log('[FALLBACK] Quota exhausted detected - skipping provider but continuing fallback:', provider.id)
            exhaustedProviders.add(provider.id) // Mark as exhausted for this request
            await this.updateProviderHealth(provider.id, {
              healthStatus: 'unavailable',
              healthError: providerError.message,
              consecutiveFailureCount: 3,
            })
            // Continue to next provider in the chain
            continue
          }
          
          console.log('[FALLBACK] Non-retryable error - stopping fallback chain:', providerError.type)
          await this.updateProviderHealth(provider.id, {
            healthStatus: 'unavailable',
            healthError: providerError.message,
            consecutiveFailureCount: 3,
          })
          // Non-retryable error - don't try more providers
          throw error
        }

        // Retryable error - mark as degraded and try next provider
        console.log('[FALLBACK] Retryable error - trying next provider')
        await this.updateProviderHealth(provider.id, {
          healthStatus: 'degraded',
          healthError: providerError.message,
          consecutiveFailureCount: 1,
        })
      }
    }

    // All providers failed
    console.log('[FALLBACK] All providers failed - throwing error')
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
