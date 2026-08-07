import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/cohorts/[id]/activate
 * Activate a cohort (set is_current = true, deactivate all others)
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()

    const { id } = params

    // First, deactivate all cohorts
    await supabaseAdmin
      .from('cohorts')
      .update({ is_current: false })
      .neq('id', id)

    // Then activate the specified cohort
    const { data, error } = await supabaseAdmin
      .from('cohorts')
      .update({ 
        is_current: true,
        status: 'active'
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error activating cohort:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, cohort: data })
  } catch (error: any) {
    console.error('[POST /api/admin/cohorts/[id]/activate] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}