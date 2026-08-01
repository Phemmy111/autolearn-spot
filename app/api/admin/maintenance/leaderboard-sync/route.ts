import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase'
import { triggerLeaderboardUpdate } from '@/lib/leaderboard-scoring'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    await requireAdmin()

    const body = await request.json().catch(() => ({}))
    const { cohortId } = body

    let results: any[] = []
    const startTime = Date.now()

    let studentsProcessed = 0
    let studentsSucceeded = 0
    let studentsFailed = 0
    let leaderboardEntriesUpdated = 0

    if (cohortId) {
      console.log(`[maintenance] [leaderboard-sync] Starting for cohort: ${cohortId}`)
      
      const { data: enrollments, error: enrollError } = await supabaseAdmin
        .from('enrollments')
        .select('clerk_user_id')
        .eq('cohort_id', cohortId)
        .eq('status', 'active')

      if (enrollError) {
        console.error(`[maintenance] [leaderboard-sync] DB Error fetching enrollments:`, enrollError)
        return NextResponse.json({ error: 'Database error fetching enrollments' }, { status: 500 })
      }

      if (!enrollments || enrollments.length === 0) {
        return NextResponse.json({ error: 'No active students found in cohort' }, { status: 404 })
      }

      for (const enrollment of enrollments) {
        studentsProcessed++
        try {
          await triggerLeaderboardUpdate(enrollment.clerk_user_id, 'assignment')
          studentsSucceeded++
          leaderboardEntriesUpdated++
          results.push({ 
            userId: enrollment.clerk_user_id, 
            status: 'success' 
          })
        } catch (error) {
          studentsFailed++
          console.error(`[maintenance] [leaderboard-sync] Error for user ${enrollment.clerk_user_id}:`, error)
          results.push({ 
            userId: enrollment.clerk_user_id, 
            status: 'error', 
            error: 'Failed to sync leaderboard' 
          })
        }
      }

      const executionTimeMs = Date.now() - startTime
      return NextResponse.json({ 
        success: true, 
        operation: 'leaderboard-sync',
        scope: 'cohort',
        cohortId,
        executionTimeMs,
        studentsProcessed,
        studentsSucceeded,
        studentsFailed,
        leaderboardEntriesUpdated,
        results 
      })
    } else {
      console.log(`[maintenance] [leaderboard-sync] Starting for all active cohorts`)
      const { data: cohorts, error: cohortError } = await supabaseAdmin
        .from('cohorts')
        .select('id')
        .eq('status', 'active')

      if (cohortError) {
        console.error(`[maintenance] [leaderboard-sync] DB Error fetching cohorts:`, cohortError)
        return NextResponse.json({ error: 'Database error fetching cohorts' }, { status: 500 })
      }

      if (!cohorts || cohorts.length === 0) {
        return NextResponse.json({ error: 'No active cohorts found' }, { status: 404 })
      }

      for (const cohort of cohorts) {
        try {
          const { data: enrollments, error: enrollError } = await supabaseAdmin
            .from('enrollments')
            .select('clerk_user_id')
            .eq('cohort_id', cohort.id)
            .eq('status', 'active')

          if (enrollError) {
            console.error(`[maintenance] [leaderboard-sync] DB Error fetching enrollments for cohort ${cohort.id}:`, enrollError)
            continue
          }

          if (enrollments) {
            for (const enrollment of enrollments) {
              studentsProcessed++
              try {
                await triggerLeaderboardUpdate(enrollment.clerk_user_id, 'assignment')
                studentsSucceeded++
                leaderboardEntriesUpdated++
              } catch (error) {
                studentsFailed++
                console.error(`[maintenance] [leaderboard-sync] Error for user ${enrollment.clerk_user_id}:`, error)
              }
            }
          }

          results.push({ 
            cohortId: cohort.id, 
            status: 'success', 
            students: enrollments?.length || 0 
          })
        } catch (error) {
          console.error(`[maintenance] [leaderboard-sync] Error for cohort ${cohort.id}:`, error)
          results.push({ 
            cohortId: cohort.id, 
            status: 'error', 
            error: 'Failed to process cohort' 
          })
        }
      }

      const executionTimeMs = Date.now() - startTime
      return NextResponse.json({ 
        success: true, 
        operation: 'leaderboard-sync',
        scope: 'all-cohorts',
        executionTimeMs,
        studentsProcessed,
        studentsSucceeded,
        studentsFailed,
        leaderboardEntriesUpdated,
        results 
      })
    }
  } catch (error: any) {
    console.error('[maintenance] [leaderboard-sync] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
