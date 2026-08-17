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

// GET - Super Admin only: Get all ALEX providers
export async function GET() {
  try {
    await requireSuperAdmin()

    const { data: providers, error } = await supabaseAdmin
      .from('alex_provider_config')
      .select('*')
      .order('priority', { ascending: true })

    if (error) throw error

    // Don't return encrypted API keys
    const safeProviders = providers?.map(p => {
      const { api_key_encrypted, ...rest } = p
      return rest
    }) || []

    return NextResponse.json({ providers: safeProviders })
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Super admin access required' }, { status: 403 })
    }
    console.error('Unexpected error fetching ALEX providers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Super Admin only: Create new ALEX provider
export async function POST(request: Request) {
  try {
    await requireSuperAdmin()

    const body = await request.json()
    const {
      provider_name,
      display_name,
      provider_type,
      api_key,
      base_url,
      current_model,
      priority,
      fallback_enabled,
      auth_type,
      request_timeout,
    } = body

    // Validate required fields
    if (!provider_name || !display_name || !provider_type || !current_model) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const validTypes = ['self_hosted', 'groq', 'openrouter', 'gemini', 'openai', 'openai_compatible']
    if (!validTypes.includes(provider_type)) {
      return NextResponse.json({ error: 'Invalid provider type' }, { status: 400 })
    }

    // Encrypt API key if provided
    let apiKeyEncrypted = ''
    if (api_key && provider_type !== 'self_hosted') {
      apiKeyEncrypted = encrypt(api_key)
    }

    const { data: provider, error } = await supabaseAdmin
      .from('alex_provider_config')
      .insert({
        provider_name,
        display_name,
        provider_type,
        api_key_encrypted: apiKeyEncrypted,
        base_url: base_url || null,
        current_model,
        priority: priority || 1,
        fallback_enabled: fallback_enabled !== false,
        auth_type: auth_type || (provider_type === 'self_hosted' ? 'none' : 'bearer'),
        request_timeout: request_timeout || 30000,
        is_active: true,
        health_status: 'unknown',
        capabilities: ['streaming'], // Default capabilities
      })
      .select()
      .single()

    if (error) throw error

    // Don't return encrypted API key
    const { api_key_encrypted, ...safeProvider } = provider

    return NextResponse.json({ provider: safeProvider }, { status: 201 })
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Super admin access required' }, { status: 403 })
    }
    console.error('Error creating ALEX provider:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
