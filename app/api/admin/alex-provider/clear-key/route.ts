import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase'

// POST - Clear encrypted API key (to allow re-entry)
export async function POST(request: Request) {
  try {
    await requireSuperAdmin()

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Provider ID required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('alex_provider_config')
      .update({ 
        api_key_encrypted: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ 
      success: true,
      message: 'API key cleared. Please re-enter your API key in the admin panel.'
    })
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Super admin access required' }, { status: 403 })
    }
    console.error('Error clearing API key:', error)
    return NextResponse.json({ error: error.message || 'Failed to clear API key' }, { status: 500 })
  }
}
