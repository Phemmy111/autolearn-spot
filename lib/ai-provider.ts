import { supabase } from '@/lib/supabase'
import crypto from 'crypto'
import { currentUser } from '@clerk/nextjs/server'

export type ProviderType = 'openrouter' | 'openai' | 'gemini' | 'groq'

export interface AIProvider {
  id: string
  name: string
  provider_type: ProviderType
  api_key_encrypted: string
  base_url: string | null
  default_model: string | null
  is_active: boolean
  is_default: boolean
  models: any
  last_model_fetch: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface ProviderConfig {
  name: string
  provider_type: ProviderType
  api_key: string
  base_url?: string
  default_model?: string
}

// Provider-specific configurations
const PROVIDER_CONFIGS: Record<ProviderType, { baseUrl: string; modelsEndpoint: string }> = {
  openrouter: {
    baseUrl: 'https://openrouter.ai/api/v1',
    modelsEndpoint: 'https://openrouter.ai/api/v1/models',
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    modelsEndpoint: 'https://api.openai.com/v1/models',
  },
  gemini: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    modelsEndpoint: null, // Gemini doesn't have a public models endpoint
  },
  groq: {
    baseUrl: 'https://api.groq.com/openai/v1',
    modelsEndpoint: 'https://api.groq.com/openai/v1/models',
  },
}

// Default model lists for providers without models endpoints
const DEFAULT_MODELS: Record<ProviderType, string[]> = {
  openrouter: [], // Will be fetched
  openai: [], // Will be fetched
  gemini: [
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-1.0-pro',
    'gemini-pro',
    'gemini-pro-vision',
  ],
  groq: [], // Will be fetched
}

// Encryption key (must be 32 bytes for AES-256)
const ENCRYPTION_KEY = process.env.AI_PROVIDER_ENCRYPTION_KEY || 'default-key-change-in-production-32bytes'

// Ensure the key is exactly 32 bytes for AES-256
function getEncryptionKey(): Buffer {
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32))
  return key
}

// AES-256-GCM encryption
function encrypt(text: string): string {
  try {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(16) // Initialization vector
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
    
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const authTag = cipher.getAuthTag()
    
    // Combine IV + authTag + encrypted data
    const combined = Buffer.concat([
      iv,
      authTag,
      Buffer.from(encrypted, 'hex')
    ])
    
    return combined.toString('base64')
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

// AES-256-GCM decryption
function decrypt(encrypted: string): string {
  try {
    const key = getEncryptionKey()
    const combined = Buffer.from(encrypted, 'base64')
    
    // Extract IV, authTag, and encrypted data
    const iv = combined.slice(0, 16)
    const authTag = combined.slice(16, 32)
    const encryptedData = combined.slice(32)
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encryptedData)
    decrypted = Buffer.concat([decrypted, decipher.final()])
    
    return decrypted.toString('utf8')
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt data')
  }
}

export class AIProviderManager {
  /**
   * Get the default active provider
   */
  static async getDefaultProvider(): Promise<AIProvider | null> {
    try {
      const { data, error } = await supabase
        .from('ai_providers')
        .select('*')
        .eq('is_default', true)
        .eq('is_active', true)
        .single()

      if (error) {
        console.error('Error fetching default provider:', error)
        return null
      }

      return data as AIProvider
    } catch (error) {
      console.error('Error fetching default provider:', error)
      return null
    }
  }

  /**
   * Get all active providers
   */
  static async getActiveProviders(): Promise<AIProvider[]> {
    try {
      const { data, error } = await supabase
        .from('ai_providers')
        .select('*')
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching providers:', error)
        return []
      }

      return data as AIProvider[]
    } catch (error) {
      console.error('Error fetching providers:', error)
      return []
    }
  }

  /**
   * Get a specific provider by ID
   */
  static async getProvider(id: string): Promise<AIProvider | null> {
    try {
      const { data, error } = await supabase
        .from('ai_providers')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching provider:', error)
        return null
      }

      return data as AIProvider
    } catch (error) {
      console.error('Error fetching provider:', error)
      return null
    }
  }

  /**
   * Create a new provider
   */
  static async createProvider(config: ProviderConfig, createdBy: string): Promise<AIProvider | null> {
    try {
      const encryptedKey = encrypt(config.api_key)

      // If this is set as default, unset any existing default
      if (config.default_model) {
        await supabase
          .from('ai_providers')
          .update({ is_default: false })
          .eq('is_default', true)
      }

      const { data, error } = await supabase
        .from('ai_providers')
        .insert({
          name: config.name,
          provider_type: config.provider_type,
          api_key_encrypted: encryptedKey,
          base_url: config.base_url || null,
          default_model: config.default_model || null,
          is_active: true,
          is_default: !!config.default_model,
          created_by: createdBy,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating provider:', error)
        return null
      }

      return data as AIProvider
    } catch (error) {
      console.error('Error creating provider:', error)
      return null
    }
  }

  /**
   * Update a provider
   */
  static async updateProvider(id: string, config: Partial<ProviderConfig>): Promise<AIProvider | null> {
    try {
      const updates: any = {
        updated_at: new Date().toISOString(),
      }

      if (config.name) updates.name = config.name
      if (config.provider_type) updates.provider_type = config.provider_type
      if (config.api_key) updates.api_key_encrypted = encrypt(config.api_key)
      if (config.base_url !== undefined) updates.base_url = config.base_url || null
      if (config.default_model !== undefined) updates.default_model = config.default_model || null

      // If setting as default, unset any existing default
      if (config.default_model) {
        await supabase
          .from('ai_providers')
          .update({ is_default: false })
          .eq('is_default', true)
          .neq('id', id)
        updates.is_default = true
      }

      const { data, error } = await supabase
        .from('ai_providers')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating provider:', error)
        return null
      }

      return data as AIProvider
    } catch (error) {
      console.error('Error updating provider:', error)
      return null
    }
  }

  /**
   * Delete a provider
   */
  static async deleteProvider(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ai_providers')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting provider:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error deleting provider:', error)
      return false
    }
  }

  /**
   * Set a provider as default
   */
  static async setDefaultProvider(id: string): Promise<boolean> {
    try {
      // Unset existing default
      await supabase
        .from('ai_providers')
        .update({ is_default: false })
        .eq('is_default', true)

      // Set new default
      const { error } = await supabase
        .from('ai_providers')
        .update({ is_default: true })
        .eq('id', id)

      if (error) {
        console.error('Error setting default provider:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error setting default provider:', error)
      return false
    }
  }

  /**
   * Test a provider connection
   */
  static async testProvider(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const provider = await this.getProvider(id)
      if (!provider) {
        return { success: false, error: 'Provider not found' }
      }

      const apiKey = decrypt(provider.api_key_encrypted)
      const config = PROVIDER_CONFIGS[provider.provider_type]
      const baseUrl = provider.base_url || config.baseUrl

      // Test with a simple API call
      const response = await fetch(`${baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        return { success: false, error: `API returned ${response.status}` }
      }

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message || 'Connection failed' }
    }
  }

  /**
   * Fetch models from a provider
   */
  static async fetchModels(id: string): Promise<string[]> {
    try {
      const provider = await this.getProvider(id)
      if (!provider) {
        return []
      }

      const apiKey = decrypt(provider.api_key_encrypted)
      const config = PROVIDER_CONFIGS[provider.provider_type]

      if (!config.modelsEndpoint) {
        // Use default models for providers without models endpoint
        return DEFAULT_MODELS[provider.provider_type] || []
      }

      const baseUrl = provider.base_url || config.baseUrl
      const response = await fetch(config.modelsEndpoint, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        console.error('Failed to fetch models:', response.status)
        return DEFAULT_MODELS[provider.provider_type] || []
      }

      const data = await response.json()
      
      // Parse models based on provider response format
      let models: string[] = []
      
      if (provider.provider_type === 'openrouter') {
        models = data.data?.map((m: any) => m.id) || []
      } else if (provider.provider_type === 'openai') {
        models = data.data?.map((m: any) => m.id) || []
      } else if (provider.provider_type === 'groq') {
        models = data.data?.map((m: any) => m.id) || []
      }

      // Cache the models in the database
      await supabase
        .from('ai_providers')
        .update({
          models: models,
          last_model_fetch: new Date().toISOString(),
        })
        .eq('id', id)

      return models
    } catch (error) {
      console.error('Error fetching models:', error)
      return []
    }
  }

  /**
   * Get cached models for a provider
   */
  static async getProviderModels(id: string): Promise<string[]> {
    try {
      const provider = await this.getProvider(id)
      if (!provider) {
        return []
      }

      if (provider.models && Array.isArray(provider.models)) {
        return provider.models
      }

      // If no cached models, fetch them
      return await this.fetchModels(id)
    } catch (error) {
      console.error('Error getting provider models:', error)
      return []
    }
  }

  /**
   * Get cost controls
   */
  private static async getCostControls(): Promise<{
    maxTokens: number
    temperature: number
    dailyRequestLimit: number
    monthlyRequestLimit: number
    maxRetries: number
    requestTimeoutMs: number
    enabled: boolean
  } | null> {
    try {
      const { data, error } = await supabase
        .from('ai_cost_controls')
        .select('*')
        .eq('enabled', true)
        .single()

      if (error) {
        // Return default controls if none exist
        return {
          maxTokens: 4000,
          temperature: 0.7,
          dailyRequestLimit: 100,
          monthlyRequestLimit: 3000,
          maxRetries: 3,
          requestTimeoutMs: 30000,
          enabled: true,
        }
      }

      return {
        maxTokens: data.max_tokens || 4000,
        temperature: parseFloat(data.temperature) || 0.7,
        dailyRequestLimit: data.daily_request_limit || 100,
        monthlyRequestLimit: data.monthly_request_limit || 3000,
        maxRetries: data.max_retries || 3,
        requestTimeoutMs: data.request_timeout_ms || 30000,
        enabled: data.enabled !== false,
      }
    } catch (error) {
      console.error('Error fetching cost controls:', error)
      return null
    }
  }

  /**
   * Check request limits
   */
  private static async checkRequestLimits(): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const controls = await this.getCostControls()
      if (!controls || !controls.enabled) {
        return { allowed: true }
      }

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const thisMonth = new Date()
      thisMonth.setDate(1)
      thisMonth.setHours(0, 0, 0, 0)

      // Check daily limit
      const { count: dailyCount } = await supabase
        .from('ai_usage_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString())

      if (dailyCount && dailyCount >= controls.dailyRequestLimit) {
        return { allowed: false, reason: 'Daily request limit exceeded' }
      }

      // Check monthly limit
      const { count: monthlyCount } = await supabase
        .from('ai_usage_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thisMonth.toISOString())

      if (monthlyCount && monthlyCount >= controls.monthlyRequestLimit) {
        return { allowed: false, reason: 'Monthly request limit exceeded' }
      }

      return { allowed: true }
    } catch (error) {
      console.error('Error checking request limits:', error)
      return { allowed: true } // Allow on error to avoid blocking
    }
  }

  /**
   * Make an AI completion request with automatic failover
   */
  static async completion(
    prompt: string,
    options?: {
      providerId?: string
      model?: string
      temperature?: number
      maxTokens?: number
    }
  ): Promise<{ success: boolean; content?: string; error?: string; providerUsed?: string }> {
    // Check request limits
    const limitCheck = await this.checkRequestLimits()
    if (!limitCheck.allowed) {
      return { success: false, error: limitCheck.reason || 'Request limit exceeded' }
    }

    // Get cost controls
    const controls = await this.getCostControls()
    
    const startTime = Date.now()
    let providersToTry: AIProvider[] = []
    
    // If specific provider is requested, try only that one
    if (options?.providerId) {
      const provider = await this.getProvider(options.providerId)
      if (provider) {
        providersToTry = [provider]
      }
    } else {
      // Try default provider first, then other active providers
      const defaultProvider = await this.getDefaultProvider()
      if (defaultProvider) {
        providersToTry.push(defaultProvider)
      }
      
      // Get other active providers (excluding default)
      const allProviders = await this.getActiveProviders()
      const otherProviders = allProviders.filter(p => p.id !== defaultProvider?.id)
      providersToTry.push(...otherProviders)
    }

    if (providersToTry.length === 0) {
      return { success: false, error: 'No providers available' }
    }

    // Try each provider in order
    for (const provider of providersToTry) {
      try {
        const result = await this.completionWithProvider(
          provider, 
          prompt, 
          {
            ...options,
            temperature: options?.temperature ?? controls?.temperature,
            maxTokens: options?.maxTokens ?? controls?.maxTokens,
          },
          startTime
        )
        
        if (result.success) {
          console.log(`AI request succeeded with provider: ${provider.name} (${provider.provider_type})`)
          return { 
            success: true, 
            content: result.content, 
            providerUsed: provider.name 
          }
        }
        
        console.warn(`Provider ${provider.name} failed: ${result.error}, trying next provider...`)
      } catch (error: any) {
        console.warn(`Provider ${provider.name} threw error: ${error.message}, trying next provider...`)
      }
    }

    // All providers failed
    return { success: false, error: 'All AI providers failed. Please check provider configuration and API keys.' }
  }

  /**
   * Log AI usage
   */
  private static async logUsage(
    provider: AIProvider,
    model: string,
    prompt: string,
    responseTimeMs: number,
    success: boolean,
    errorMessage?: string,
    tokensUsed?: number
  ): Promise<void> {
    try {
      const user = await currentUser()
      const adminUserId = user?.id

      await supabase.from('ai_usage_logs').insert({
        admin_user_id: adminUserId,
        provider_id: provider.id,
        provider_name: provider.name,
        provider_type: provider.provider_type,
        model,
        prompt: prompt.substring(0, 1000), // Truncate long prompts
        response_time_ms: responseTimeMs,
        success,
        error_message: errorMessage,
        tokens_used: tokensUsed,
      })
    } catch (error) {
      console.error('Error logging AI usage:', error)
      // Don't throw - logging failures shouldn't break the main flow
    }
  }

  /**
   * Make an AI completion request with a specific provider
   */
  private static async completionWithProvider(
    provider: AIProvider,
    prompt: string,
    options?: {
      model?: string
      temperature?: number
      maxTokens?: number
    },
    startTime?: number
  ): Promise<{ success: boolean; content?: string; error?: string; tokensUsed?: number }> {
    const requestStartTime = Date.now()
    try {
      const apiKey = decrypt(provider.api_key_encrypted)
      const config = PROVIDER_CONFIGS[provider.provider_type]
      const baseUrl = provider.base_url || config.baseUrl
      const model = options?.model || provider.default_model

      if (!model) {
        return { success: false, error: 'No model specified' }
      }

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'Autolearn AI',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: options?.temperature || 0.7,
          max_tokens: options?.maxTokens || 4000,
        }),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      })

      const responseTimeMs = Date.now() - requestStartTime

      if (!response.ok) {
        const error = await response.text()
        console.error('AI API error:', error)
        
        await this.logUsage(
          provider,
          model,
          prompt,
          responseTimeMs,
          false,
          `API error: ${response.status}`
        )
        
        return { success: false, error: `API error: ${response.status}` }
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content
      const tokensUsed = data.usage?.total_tokens

      if (!content) {
        await this.logUsage(
          provider,
          model,
          prompt,
          responseTimeMs,
          false,
          'No content in response'
        )
        return { success: false, error: 'No content in response' }
      }

      await this.logUsage(
        provider,
        model,
        prompt,
        responseTimeMs,
        true,
        undefined,
        tokensUsed
      )

      return { success: true, content, tokensUsed }
    } catch (error: any) {
      const responseTimeMs = Date.now() - requestStartTime
      
      if (error.name === 'AbortError') {
        await this.logUsage(
          provider,
          options?.model || provider.default_model || 'unknown',
          prompt,
          responseTimeMs,
          false,
          'Request timeout'
        )
        return { success: false, error: 'Request timeout' }
      }
      
      console.error('AI completion error:', error)
      
      await this.logUsage(
        provider,
        options?.model || provider.default_model || 'unknown',
        prompt,
        responseTimeMs,
        false,
        error.message || 'Completion failed'
      )
      
      return { success: false, error: error.message || 'Completion failed' }
    }
  }
}
