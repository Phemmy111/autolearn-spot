import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentCohortId } from '@/lib/progress-service'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireAdmin()

    const cohortId = await getCurrentCohortId()

    const { data: enrollments } = await supabaseAdmin
      .from('enrollments')
      .select('clerk_user_id, email, full_name, first_name, last_name, status')
      .eq('cohort_id', cohortId)
      .order('full_name', { ascending: true })

    return NextResponse.json({ students: enrollments || [] })
  } catch (error: any) {
    console.error('[GET /api/admin/debug/students] Error:', error)
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
