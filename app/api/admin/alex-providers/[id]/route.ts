import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase'
import { AIEngine } from '@/lib/alex/ai-engine'

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
