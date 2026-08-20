import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase'
import crypto from 'crypto'

// Encryption key (matching quiz system approach)
const ENCRYPTION_KEY = process.env.ALEX_PROVIDER_ENCRYPTION_KEY || 'default-key-change-in-production-32bytes'

// Simple encryption key handling (matching quiz system)
function getEncryptionKey(): Buffer {
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32))
  return key
}

function decrypt(encrypted: string): string {
  try {
    const key = getEncryptionKey()
    const combined = Buffer.from(encrypted, 'base64')

    const iv = combined.subarray(0, 16)
    const authTag = combined.subarray(16, 32)
    const encryptedData = combined.subarray(32)

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    console.error('ALEX Decryption error:', error)
    throw new Error('Failed to decrypt API key')
  }
}

function getDefaultBaseUrl(providerType: string): string {
  const defaults: Record<string, string> = {
    groq: 'https://api.groq.com/openai/v1',
    openrouter: 'https://openrouter.ai/api/v1',
    openai: 'https://api.openai.com/v1',
    gemini: 'https://generativelanguage.googleapis.com/v1beta',
    openai_compatible: '',
    self_hosted: '',
  }
  return defaults[providerType] || ''
}

// POST - Super Admin only: Fetch models from provider
export async function POST(request: Request) {
  try {
    await requireSuperAdmin()

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Provider ID required' }, { status: 400 })
    }

    // Get provider config from database
    const { data: provider, error } = await supabaseAdmin
      .from('alex_provider_config')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    try {
      // For Gemini, fetch from Google's official API
      if (provider.provider_type === 'gemini') {
        // Decrypt API key
        let apiKey: string | null = null
        if (provider.api_key_encrypted) {
          try {
            apiKey = decrypt(provider.api_key_encrypted)
          } catch (error) {
            console.error('Failed to decrypt Gemini API key:', error)
            return NextResponse.json({ 
              error: 'Failed to decrypt API key',
              details: 'Please re-enter your API key in the admin panel using the Replace Key option'
            }, { status: 500 })
          }
        } else {
          return NextResponse.json({ 
            error: 'No API key configured for Gemini',
            details: 'Please add an API key in the admin panel before fetching models'
          }, { status: 400 })
        }

        if (!apiKey) {
          return NextResponse.json({ 
            error: 'No API key available',
            details: 'Please configure an API key for this provider'
          }, { status: 400 })
        }

        const baseUrl = provider.base_url || getDefaultBaseUrl(provider.provider_type)
        const response = await fetch(`${baseUrl}/models?key=${apiKey}`, {
          signal: AbortSignal.timeout(30000),
        })

        if (!response.ok) {
          const errorText = await response.text()
          let errorMessage = `Failed to fetch Gemini models: ${response.status}`
          try {
            const errorJson = JSON.parse(errorText)
            if (errorJson.error?.message) {
              errorMessage = errorJson.error.message
            }
          } catch {
            // Keep original error text if not JSON
          }
          throw new Error(errorMessage)
        }

        const data = await response.json()
        
        // Normalize Gemini model names: remove 'models/' prefix if present
        const models = data.models
          ?.filter((m: any) => m.name) // Filter for models with names
          .map((m: any) => {
            let modelName = m.name
            // Remove 'models/' prefix to match internal format
            if (modelName.startsWith('models/')) {
              modelName = modelName.replace('models/', '')
            }
            return modelName
          }) || []

        await supabaseAdmin
          .from('alex_provider_config')
          .update({
            models: { available: models },
            model_list_metadata: { lastRefreshed: new Date().toISOString() },
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)

        return NextResponse.json({ models })
      }

      // For OpenAI-compatible providers, fetch from /models endpoint
      const baseUrl = provider.base_url || getDefaultBaseUrl(provider.provider_type)

      // If no base URL available, return error
      if (!baseUrl) {
        return NextResponse.json({ 
          error: 'Base URL required for this provider type',
          details: 'Please configure a base URL in the provider settings'
        }, { status: 400 })
      }
      
      // Build auth headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      // Decrypt and add API key if available
      if (provider.api_key_encrypted && provider.provider_type !== 'self_hosted') {
        try {
          const apiKey = decrypt(provider.api_key_encrypted)

          if (provider.auth_type === 'bearer' && apiKey) {
            headers['Authorization'] = `Bearer ${apiKey}`
          } else if (provider.auth_type === 'api_key' && apiKey) {
            headers['Authorization'] = `Key ${apiKey}`
          } else if (provider.auth_type === 'custom' && apiKey) {
            headers['Authorization'] = apiKey
          }
        } catch (error) {
          console.error('Failed to decrypt API key for model discovery:', error)
          return NextResponse.json({ 
            error: 'Failed to decrypt API key',
            details: 'Please re-enter your API key in the admin panel using the Replace Key option'
          }, { status: 500 })
        }
      } else if (provider.provider_type !== 'self_hosted' && !provider.api_key_encrypted) {
        return NextResponse.json({ 
          error: 'No API key configured for this provider',
          details: 'Please add an API key in the admin panel before fetching models'
        }, { status: 400 })
      }



      // Add OpenRouter-specific headers
      if (provider.provider_type === 'openrouter') {
        headers['HTTP-Referer'] = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        headers['X-Title'] = 'Autolearn ALEX'
      }

      const response = await fetch(`${baseUrl}/models`, {
        headers,
        signal: AbortSignal.timeout(30000),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch models: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      const models = data.data?.map((m: any) => m.id) || []

      await supabaseAdmin
        .from('alex_provider_config')
        .update({
          models: { available: models },
          model_list_metadata: { lastRefreshed: new Date().toISOString() },
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      return NextResponse.json({ models })
    } catch (error: any) {
      console.error('Error fetching models from provider:', error)
      return NextResponse.json({ 
        error: error.message || 'Failed to fetch models',
        details: error.stack?.substring(0, 200) || 'No stack trace available'
      }, { status: 500 })
    }
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Super admin access required' }, { status: 403 })
    }
    console.error('Unexpected error fetching ALEX provider models:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
