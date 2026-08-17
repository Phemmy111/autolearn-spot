import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/admin'
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

const PROVIDER_CONFIGS: Record<string, { baseUrl: string; modelsEndpoint: string | null }> = {
  self_hosted: {
    baseUrl: '',
    modelsEndpoint: null,
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
    modelsEndpoint: null,
  },
  groq: {
    baseUrl: 'https://api.groq.com/openai/v1',
    modelsEndpoint: 'https://api.groq.com/openai/v1/models',
  },
  openai_compatible: {
    baseUrl: '',
    modelsEndpoint: null,
  },
}

// POST /api/admin/alex-provider/models/fetch-models - Fetch models for a new provider (before creation)
export async function POST(request: Request) {
  try {
    await requireSuperAdmin()

    const body = await request.json()
    const { provider_type, api_key, base_url } = body

    if (!provider_type) {
      return NextResponse.json({ error: 'Provider type is required' }, { status: 400 })
    }

    // For Gemini, use default models list (no public API)
    if (provider_type === 'gemini') {
      const defaultModels = [
        'gemini-1.5-pro',
        'gemini-1.5-flash',
        'gemini-1.0-pro',
        'gemini-pro',
        'gemini-pro-vision',
      ]
      return NextResponse.json({ models: defaultModels })
    }

    // Get provider config
    const config = PROVIDER_CONFIGS[provider_type]
    if (!config) {
      return NextResponse.json({ error: 'Invalid provider type' }, { status: 400 })
    }

    // For OpenAI-compatible providers, use provided base URL
    const baseUrl = base_url || config.baseUrl
    if (!baseUrl) {
      return NextResponse.json({ error: 'Base URL is required for this provider type' }, { status: 400 })
    }

    // For self-hosted and custom providers, no models endpoint
    if (!config.modelsEndpoint) {
      return NextResponse.json({ error: 'Model discovery not supported for this provider type' }, { status: 400 })
    }

    // Build headers with API key
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (api_key) {
      headers['Authorization'] = `Bearer ${api_key}`
    }

    // Fetch models
    const response = await fetch(`${baseUrl}/models`, {
      headers,
      signal: AbortSignal.timeout(30000),
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json({ error: `Failed to fetch models: ${response.status} - ${error}` }, { status: response.status })
    }

    const data = await response.json()
    const models = data.data?.map((m: any) => m.id) || []

    return NextResponse.json({ models })
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Super admin access required' }, { status: 403 })
    }
    console.error('Error fetching models for new provider:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
