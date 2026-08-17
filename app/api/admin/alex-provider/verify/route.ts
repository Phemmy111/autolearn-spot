import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase'

// Safe database verification endpoint
// GET /api/admin/alex-provider/verify?id=<provider_id>
// Returns only safe configuration status, never actual keys
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
      .select(`
        id,
        provider_name,
        provider_type,
        is_active,
        priority,
        current_model,
        auth_type,
        base_url,
        api_key_encrypted
      `)
      .eq('id', id)
      .single()

    if (error || !provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 })
    }

    // Return only safe status information
    return NextResponse.json({
      id: provider.id,
      provider_name: provider.provider_name,
      provider_type: provider.provider_type,
      is_active: provider.is_active,
      priority: provider.priority,
      current_model: provider.current_model,
      auth_type: provider.auth_type,
      base_url: provider.base_url,
      api_key_configured: !!provider.api_key_encrypted,
      verification: {
        has_provider_id: !!provider.id,
        has_current_model: !!provider.current_model,
        has_api_key: !!provider.api_key_encrypted,
        is_configured: !!provider.current_model && !!provider.api_key_encrypted,
      }
    })
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Super admin access required' }, { status: 403 })
    }
    console.error('Error verifying provider:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
