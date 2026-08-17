import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase'
import crypto from 'crypto'

// Simple diagnostic endpoint to test Groq API connectivity
// GET /api/admin/alex-provider/test-groq?id=<provider_id>
export async function GET(request: Request) {
  try {
    await requireSuperAdmin()

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Provider ID required' }, { status: 400 })
    }

    const { data: provider, error } = await supabaseAdmin
      .from('alex_provider_config')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    const ENCRYPTION_KEY = process.env.ALEX_PROVIDER_ENCRYPTION_KEY
    if (!ENCRYPTION_KEY) {
      return NextResponse.json({ error: 'Encryption key not configured' }, { status: 500 })
    }

    // Test decryption
    let apiKey = ''
    try {
      const key = Buffer.from(ENCRYPTION_KEY, 'base64')
      const combined = Buffer.from(provider.api_key_encrypted || '', 'base64')
      const iv = combined.subarray(0, 16)
      const authTag = combined.subarray(16, 32)
      const encryptedData = combined.subarray(32)
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
      decipher.setAuthTag(authTag)
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      apiKey = decrypted
    } catch (error) {
      return NextResponse.json({ 
        error: 'Decryption failed',
        details: 'The encryption key in Vercel may not match the one used to encrypt the API key'
      }, { status: 500 })
    }

    // Test Groq API call
    const baseUrl = provider.base_url || 'https://api.groq.com/openai/v1'
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    }

    const response = await fetch(`${baseUrl}/models`, {
      headers,
      signal: AbortSignal.timeout(10000),
    })

    const responseData = await response.text()

    return NextResponse.json({
      decryption: 'success',
      api_call: {
        url: `${baseUrl}/models`,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        response_preview: responseData.substring(0, 500),
      },
      provider: {
        type: provider.provider_type,
        has_encrypted_key: !!provider.api_key_encrypted,
        auth_type: provider.auth_type,
      }
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack?.substring(0, 500)
    }, { status: 500 })
  }
}
