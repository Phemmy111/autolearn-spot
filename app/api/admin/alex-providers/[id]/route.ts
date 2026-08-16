import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase'
import { AIEngine } from '@/lib/alex/ai-engine'
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

// PATCH - Super Admin only: Update provider
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireSuperAdmin()

    const body = await request.json()
    const { id } = params

    const updates: any = {
      updated_at: new Date().toISOString(),
    }

    if (body.is_active !== undefined) updates.is_active = body.is_active
    if (body.priority !== undefined) updates.priority = body.priority
    if (body.fallback_enabled !== undefined) updates.fallback_enabled = body.fallback_enabled
    if (body.current_model) updates.current_model = body.current_model
    if (body.base_url !== undefined) updates.base_url = body.base_url || null
    if (body.display_name) updates.display_name = body.display_name
    if (body.request_timeout !== undefined) updates.request_timeout = body.request_timeout

    // Handle API key update if provided
    if (body.api_key) {
      updates.api_key_encrypted = encrypt(body.api_key)
    }

    const { data: provider, error } = await supabaseAdmin
      .from('alex_provider_config')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Don't return encrypted API key
    const { api_key_encrypted, ...safeProvider } = provider

    return NextResponse.json({ provider: safeProvider })
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Super admin access required' }, { status: 403 })
    }
    console.error('Error updating ALEX provider:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Super Admin only: Delete provider
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireSuperAdmin()

    const { id } = params

    const { error } = await supabaseAdmin
      .from('alex_provider_config')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Super admin access required' }, { status: 403 })
    }
    console.error('Error deleting ALEX provider:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
