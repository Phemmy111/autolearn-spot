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

// POST - Super Admin only: Test provider connection
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
      // Decrypt API key
      const apiKey = provider.api_key_encrypted ? decrypt(provider.api_key_encrypted) : null

      // Build request based on provider type
      const baseUrl = provider.base_url || getDefaultBaseUrl(provider.provider_type)
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (provider.auth_type === 'bearer' && apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`
      } else if (provider.auth_type === 'api_key' && apiKey) {
        headers['Authorization'] = `Key ${apiKey}`
      } else if (provider.auth_type === 'custom' && apiKey) {
        headers['Authorization'] = apiKey
      }

      // Add OpenRouter-specific headers
      if (provider.provider_type === 'openrouter') {
        headers['HTTP-Referer'] = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        headers['X-Title'] = 'Autolearn ALEX'
      }

      // Test with a simple completion request
      const testPayload = {
        model: provider.current_model || 'test',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 10,
      }

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(testPayload),
        signal: AbortSignal.timeout(30000),
      })

      if (response.ok) {
        // Update provider health on success
        await supabaseAdmin
          .from('alex_provider_config')
          .update({
            health_status: 'healthy',
            last_health_check: new Date().toISOString(),
            last_success_at: new Date().toISOString(),
            consecutive_failure_count: 0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)

        return NextResponse.json({ success: true })
      } else {
        const errorText = await response.text()
        throw new Error(`Provider returned ${response.status}: ${errorText}`)
      }
    } catch (error: any) {
      // Update provider health on failure
      await supabaseAdmin
        .from('alex_provider_config')
        .update({
          health_status: 'unavailable',
          health_error: error.message,
          last_health_check: new Date().toISOString(),
          consecutive_failure_count: 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      return NextResponse.json({ success: false, error: error.message })
    }
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Super admin access required' }, { status: 403 })
    }
    console.error('Error testing ALEX provider:', error)
    return NextResponse.json({ success: false, error: error.message || 'Test failed' }, { status: 500 })
  }
}
