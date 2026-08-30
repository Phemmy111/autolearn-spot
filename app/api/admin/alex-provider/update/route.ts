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

// PATCH - Super Admin only: Update provider
export async function PATCH(request: Request) {
  try {
    await requireSuperAdmin()

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Provider ID required' }, { status: 400 })
    }

    const body = await request.json()

    const updates: any = {
      updated_at: new Date().toISOString(),
    }

    if (body.is_active !== undefined) updates.is_active = body.is_active
    if (body.priority !== undefined) updates.priority = body.priority
    if (body.fallback_enabled !== undefined) updates.fallback_enabled = body.fallback_enabled
    if (body.is_vision_fallback !== undefined) {
      updates.is_vision_fallback = body.is_vision_fallback
      // If enabling vision fallback, clear it on all other providers first
      if (body.is_vision_fallback) {
        await supabaseAdmin
          .from('alex_provider_config')
          .update({ is_vision_fallback: false })
          .neq('id', id)
      }
    }
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
export async function DELETE(request: Request) {
  try {
    await requireSuperAdmin()

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Provider ID required' }, { status: 400 })
    }

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
