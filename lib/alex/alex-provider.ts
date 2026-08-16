import { supabase } from '@/lib/supabase'
import crypto from 'crypto'
import { AlexProviderConfig } from './types'

export type AlexProviderType = 'self_hosted' | 'openrouter' | 'openai' | 'gemini' | 'groq' | 'openai_compatible'

export interface AlexProviderConfigInput {
  provider_name: string
  provider_type: AlexProviderType
  api_key: string
  base_url?: string
  models?: Record<string, string[]>
  cost_controls?: {
    maxTokens: number
    temperature: number
    dailyRequestLimit: number
    monthlyRequestLimit: number
  }
}

// Provider-specific configurations
export const PROVIDER_CONFIGS: Record<AlexProviderType, { baseUrl: string; modelsEndpoint: string | null }> = {
  self_hosted: {
    baseUrl: '', // User-configured
    modelsEndpoint: null, // Depends on server
  },
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
  openai_compatible: {
    baseUrl: '', // User-configured
    modelsEndpoint: null, // Depends on server
  },
}

// Default model lists for providers without models endpoints
const DEFAULT_MODELS: Record<AlexProviderType, string[]> = {
  self_hosted: ['default'],
  openrouter: [],
  openai: [],
  gemini: [
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-1.0-pro',
    'gemini-pro',
    'gemini-pro-vision',
  ],
  groq: [],
  openai_compatible: ['default'],
}

// Encryption key (must be 32 bytes for AES-256)
const ENCRYPTION_KEY = process.env.ALEX_PROVIDER_ENCRYPTION_KEY || 'default-alex-key-change-in-production-32bytes'

// Ensure the key is exactly 32 bytes for AES-256
function getEncryptionKey(): Buffer {
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32))
  return key
}

// AES-256-GCM encryption
function encrypt(text: string): string {
  try {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
    
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const authTag = cipher.getAuthTag()
    
    const combined = Buffer.concat([
      iv,
      authTag,
      Buffer.from(encrypted, 'hex')
    ])
    
    return combined.toString('base64')
  } catch (error) {
    console.error('ALEX Encryption error:', error)
    throw new Error('Failed to encrypt ALEX provider data')
  }
}

// AES-256-GCM decryption
function decrypt(encrypted: string): string {
  try {
    const key = getEncryptionKey()
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

export class AlexProviderManager {
  /**
   * Get the active ALEX provider configuration
   */
  static async getActiveProvider(): Promise<AlexProviderConfig | null> {
    try {
      const { data, error } = await supabase
        .from('alex_provider_config')
        .select('*')
        .eq('is_active', true)
        .single()

      if (error) {
        console.error('Error fetching ALEX provider:', error)
        return null
      }

      return data as AlexProviderConfig
    } catch (error) {
      console.error('Error fetching ALEX provider:', error)
      return null
    }
  }

  /**
   * Create or update ALEX provider configuration
   */
  static async upsertProvider(config: AlexProviderConfigInput): Promise<AlexProviderConfig | null> {
    try {
      const encryptedKey = encrypt(config.api_key)

      // Check if there's an existing active provider
      const { data: existing } = await supabase
        .from('alex_provider_config')
        .select('id')
        .eq('is_active', true)
        .single()

      let result

      if (existing) {
        // Update existing provider
        const { data, error } = await supabase
          .from('alex_provider_config')
          .update({
            provider_name: config.provider_name,
            provider_type: config.provider_type,
            api_key_encrypted: encryptedKey,
            base_url: config.base_url || null,
            models: config.models || {},
            cost_controls: config.cost_controls || {
              maxTokens: 4000,
              temperature: 0.7,
              dailyRequestLimit: 100,
              monthlyRequestLimit: 3000,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single()

        if (error) {
          console.error('Error updating ALEX provider:', error)
          return null
        }
        result = data
      } else {
        // Create new provider
        const { data, error } = await supabase
          .from('alex_provider_config')
          .insert({
            provider_name: config.provider_name,
            provider_type: config.provider_type,
            api_key_encrypted: encryptedKey,
            base_url: config.base_url || null,
            models: config.models || {},
            cost_controls: config.cost_controls || {
              maxTokens: 4000,
              temperature: 0.7,
              dailyRequestLimit: 100,
              monthlyRequestLimit: 3000,
            },
            is_active: true,
          })
          .select()
          .single()

        if (error) {
          console.error('Error creating ALEX provider:', error)
          return null
        }
        result = data
      }

      return result as AlexProviderConfig
    } catch (error) {
      console.error('Error upserting ALEX provider:', error)
      return null
    }
  }

  /**
   * Test ALEX provider connection
   */
  static async testProvider(): Promise<{ success: boolean; error?: string }> {
    try {
      const provider = await this.getActiveProvider()
      if (!provider) {
        return { success: false, error: 'No active ALEX provider configured' }
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
   * Get decrypted API key for making API calls
   */
  static async getApiKey(): Promise<string | null> {
    try {
      const provider = await this.getActiveProvider()
      if (!provider) {
        return null
      }

      return decrypt(provider.api_key_encrypted)
    } catch (error) {
      console.error('Error getting ALEX API key:', error)
      return null
    }
  }

  /**
   * Get provider configuration for API calls
   */
  static async getProviderConfig(): Promise<{
    apiKey: string | null
    baseUrl: string | null
    providerType: AlexProviderType | null
    costControls: any
  } | null> {
    try {
      const provider = await this.getActiveProvider()
      if (!provider) {
        return null
      }

      const apiKey = decrypt(provider.api_key_encrypted)
      const config = PROVIDER_CONFIGS[provider.provider_type]
      const baseUrl = provider.base_url || config.baseUrl

      return {
        apiKey,
        baseUrl,
        providerType: provider.provider_type,
        costControls: provider.cost_controls,
      }
    } catch (error) {
      console.error('Error getting ALEX provider config:', error)
      return null
    }
  }
}