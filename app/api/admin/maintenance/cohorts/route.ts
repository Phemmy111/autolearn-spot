import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/maintenance/cohorts
 * 
 * Get list of active cohorts for maintenance operations
 */
export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin status
    const { data: enrollment } = await supabaseAdmin
      .from('enrollments')
      .select('role')
      .eq('clerk_user_id', userId)
      .single()

    if (!enrollment || enrollment.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

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
