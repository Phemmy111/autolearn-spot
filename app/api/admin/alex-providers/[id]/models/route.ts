import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase'
import crypto from 'crypto'

// Encryption key (must be 32 bytes for AES-256)
const ENCRYPTION_KEY = process.env.ALEX_PROVIDER_ENCRYPTION_KEY

function getEncryptionKey(): Buffer {
  if (!ENCRYPTION_KEY) {
    throw new Error('ALEX_PROVIDER_ENCRYPTION_KEY environment variable is required')
  }

  // Try base64 decoding first
  let key: Buffer
  try {
    key = Buffer.from(ENCRYPTION_KEY, 'base64')
  } catch {
    // Fallback to UTF-8 if not base64
    key = Buffer.from(ENCRYPTION_KEY, 'utf8')
  }

  // Validate key length
  if (key.length !== 32) {
    throw new Error('ALEX_PROVIDER_ENCRYPTION_KEY must be exactly 32 bytes after decoding')
  }

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
    openai_compatible: '',
    self_hosted: '',
  }
  return defaults[providerType] || ''
}

// POST - Super Admin only: Fetch models from provider
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireSuperAdmin()

    const { id } = params

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
      // For Gemini, use default models list (no public API)
      if (provider.provider_type === 'gemini') {
        const defaultModels = [
          'gemini-1.5-pro',
          'gemini-1.5-flash',
          'gemini-1.0-pro',
          'gemini-pro',
          'gemini-pro-vision',
        ]

        await supabaseAdmin
          .from('alex_provider_config')
          .update({
            models: { available: defaultModels },
            model_list_metadata: { lastRefreshed: new Date().toISOString() },
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)

        return NextResponse.json({ models: defaultModels })
      }

      // For OpenAI-compatible providers, fetch from /models endpoint
      const baseUrl = provider.base_url || getDefaultBaseUrl(provider.provider_type)
      
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
          return NextResponse.json({ error: 'Failed to decrypt API key' }, { status: 500 })
        }
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
        throw new Error(`Failed to fetch models: ${response.status}`)
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
      return NextResponse.json({ error: error.message || 'Failed to fetch models' }, { status: 500 })
    }
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Super admin access required' }, { status: 403 })
    }
    console.error('Unexpected error fetching ALEX provider models:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
