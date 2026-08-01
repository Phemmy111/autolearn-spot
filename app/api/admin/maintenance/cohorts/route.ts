import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/maintenance/cohorts
 * 
 * Get list of active cohorts for maintenance operations
 */
export async function GET() {
  try {
    await requireAdmin()

    const { data: cohorts } = await supabaseAdmin
      .from('cohorts')
      .select('id, name, status, is_current')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    return NextResponse.json({ 
      success: true, 
      cohorts: cohorts || [] 
    })
  } catch (error: any) {
    console.error('[GET /api/admin/maintenance/cohorts] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
