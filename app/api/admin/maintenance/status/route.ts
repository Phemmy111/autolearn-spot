import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/maintenance/status
 * 
 * Get system maintenance status information
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

    // Get active cohorts count
    const { count: activeCohorts } = await supabaseAdmin
      .from('cohorts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')

    // Get total active students
    const { count: totalStudents } = await supabaseAdmin
      .from('enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')

    // Get leaderboard entries count
    const { count: leaderboardEntries } = await supabaseAdmin
      .from('leaderboard')
      .select('id', { count: 'exact', head: true })

    // Get certificates count
    const { count: certificatesIssued } = await supabaseAdmin
      .from('certificates')
      .select('id', { count: 'exact', head: true })

    // Get badges count
    const { count: badgesAwarded } = await supabaseAdmin
      .from('user_badges')
      .select('id', { count: 'exact', head: true })

    // Get last leaderboard update (from leaderboard table updated_at)
    const { data: lastLeaderboardUpdate } = await supabaseAdmin
      .from('leaderboard')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Get last analytics update (we'll use lesson_progress as a proxy)
    const { data: lastAnalyticsUpdate } = await supabaseAdmin
      .from('lesson_progress')
      .select('updated_at')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    return NextResponse.json({ 
      success: true, 
      status: {
        activeCohorts: activeCohorts || 0,
        totalStudents: totalStudents || 0,
        leaderboardEntries: leaderboardEntries || 0,
        certificatesIssued: certificatesIssued || 0,
        badgesAwarded: badgesAwarded || 0,
        lastLeaderboardUpdate: lastLeaderboardUpdate?.updated_at || null,
        lastAnalyticsUpdate: lastAnalyticsUpdate?.updated_at || null,
      }
    })
  } catch (error: any) {
    console.error('[GET /api/admin/maintenance/status] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
