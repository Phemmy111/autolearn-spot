import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase'
import crypto from 'crypto'

// Secure endpoint to update API key for a provider
// POST /api/admin/alex-provider/set-key
// Body: { providerId: string, apiKey: string }
export async function POST(request: Request) {
  try {
    await requireSuperAdmin()

    const body = await request.json()
    const { providerId, apiKey } = body

    if (!providerId) {
      return NextResponse.json({ error: 'providerId required' }, { status: 400 })
    }

    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      return NextResponse.json({ error: 'apiKey required and must be non-empty' }, { status: 400 })
    }

    const ENCRYPTION_KEY = process.env.ALEX_PROVIDER_ENCRYPTION_KEY || 'default-key-change-in-production-32bytes'

    // Simple encryption (matching quiz system)
    const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32))
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

    // Update only the encrypted key
    const { error } = await supabaseAdmin
      .from('alex_provider_config')
      .update({ 
        api_key_encrypted: encryptedKey,
        updated_at: new Date().toISOString()
      })
      .eq('id', providerId)

    if (error) throw error

    // Never return the key or ciphertext
    return NextResponse.json({ 
      success: true, 
      configured: true,
      message: 'API key updated successfully' 
    })
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Super admin access required' }, { status: 403 })
    }
    console.error('Error setting API key:', error)
    return NextResponse.json({ error: error.message || 'Failed to set API key' }, { status: 500 })
  }
}
