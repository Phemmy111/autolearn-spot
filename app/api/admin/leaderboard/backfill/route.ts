import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { recalculateCohortLeaderboard } from '@/lib/leaderboard-scoring'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/leaderboard/backfill
 * 
 * Backfill leaderboard scores for all existing students across all cohorts.
 * This should be run after deploying the new scoring system.
 * 
 * This is an admin-only endpoint.
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin status (you may want to add proper admin role checking)
    const { data: enrollment } = await supabaseAdmin
      .from('enrollments')
      .select('role')
      .eq('clerk_user_id', userId)
      .maybeSingle()

    if (!enrollment || enrollment.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { cohortId } = body

    let results: any[] = []

    if (cohortId) {
      // Backfill specific cohort
      console.log(`[leaderboard-backfill] Starting backfill for cohort ${cohortId}`)
      await recalculateCohortLeaderboard(cohortId)
      results.push({ cohortId, status: 'success', message: `Backfilled cohort ${cohortId}` })
    } else {
      // Backfill all active cohorts
      const { data: cohorts } = await supabaseAdmin
        .from('cohorts')
        .select('id')
        .eq('status', 'active')

      if (!cohorts || cohorts.length === 0) {
        return NextResponse.json({ error: 'No active cohorts found' }, { status: 404 })
      }

      console.log(`[leaderboard-backfill] Starting backfill for ${cohorts.length} cohorts`)

      for (const cohort of cohorts) {
        try {
          await recalculateCohortLeaderboard(cohort.id)
          results.push({ cohortId: cohort.id, status: 'success', message: `Backfilled cohort ${cohort.id}` })
        } catch (error) {
          console.error(`[leaderboard-backfill] Error backfilling cohort ${cohort.id}:`, error)
          results.push({ cohortId: cohort.id, status: 'error', message: `Failed to backfill cohort ${cohort.id}` })
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Leaderboard backfill completed',
      results 
    })
  } catch (error: any) {
    console.error('[POST /api/admin/leaderboard/backfill] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}