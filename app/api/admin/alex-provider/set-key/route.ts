import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase'
import crypto from 'crypto'

// Emergency endpoint to directly set API key for a provider
export async function POST(request: Request) {
  try {
    await requireSuperAdmin()

    const body = await request.json()
    const { providerId, apiKey } = body

    if (!providerId || !apiKey) {
      return NextResponse.json({ error: 'providerId and apiKey required' }, { status: 400 })
    }

    const ENCRYPTION_KEY = process.env.ALEX_PROVIDER_ENCRYPTION_KEY
    if (!ENCRYPTION_KEY) {
      return NextResponse.json({ error: 'Encryption key not configured' }, { status: 500 })
    }

    const key = Buffer.from(ENCRYPTION_KEY, 'base64')
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)

    let encrypted = cipher.update(apiKey, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = cipher.getAuthTag()

    const combined = Buffer.concat([
      iv,
      authTag,
      Buffer.from(encrypted, 'hex')
    ])

    const encryptedKey = combined.toString('base64')

    const { error } = await supabaseAdmin
      .from('alex_provider_config')
      .update({ 
        api_key_encrypted: encryptedKey,
        updated_at: new Date().toISOString()
      })
      .eq('id', providerId)

    if (error) throw error

    return NextResponse.json({ success: true, message: 'API key updated successfully' })
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Super admin access required' }, { status: 403 })
    }
    console.error('Error setting API key:', error)
    return NextResponse.json({ error: error.message || 'Failed to set API key' }, { status: 500 })
  }
}
