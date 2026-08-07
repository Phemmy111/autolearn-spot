import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/cohorts
 * Create a new cohort
 */
export async function POST(request: Request) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { name, slug, price_ngn, start_date, end_date, status, timezone } = body

    const { data, error } = await supabaseAdmin
      .from('cohorts')
      .insert({
        name,
        slug,
        price_ngn,
        start_date,
        end_date,
        status,
        timezone,
        is_current: false,
        settings: {}
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating cohort:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, cohort: data })
  } catch (error: any) {
    console.error('[POST /api/admin/cohorts] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/admin/cohorts
 * Get all cohorts
 */
export async function GET() {
  try {
    await requireAdmin()

    const { data, error } = await supabaseAdmin
      .from('cohorts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching cohorts:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, cohorts: data || [] })
  } catch (error: any) {
    console.error('[GET /api/admin/cohorts] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}