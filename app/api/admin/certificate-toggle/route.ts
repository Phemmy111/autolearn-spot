import { NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    // Check current status (public, no auth needed for reading)
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', 'certificate_enabled')
      .single()

    if (error || !data) {
      return NextResponse.json({ enabled: false })
    }

    return NextResponse.json({ enabled: data.value === true || data.value === 'true' })
  } catch {
    return NextResponse.json({ enabled: false })
  }
}

export async function POST(request: Request) {
  try {
    await requireSuperAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const { enabled } = await request.json()

    // Upsert the setting
    const { error } = await supabaseAdmin
      .from('site_settings')
      .upsert(
        { key: 'certificate_enabled', value: enabled },
        { onConflict: 'key' }
      )

    if (error) {
      console.error('Error toggling certificate:', error)
      return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 })
    }

    return NextResponse.json({ enabled, success: true })
  } catch (error) {
    console.error('Error in certificate toggle:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
