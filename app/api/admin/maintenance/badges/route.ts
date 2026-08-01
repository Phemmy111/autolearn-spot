import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { checkAndAwardBadges } from '@/lib/badge-system'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/maintenance/badges
 * 
 * Recalculate badges for all students in a cohort or all active cohorts
 */
export async function POST(request: Request) {
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
      .maybeSingle()

    if (!enrollment || enrollment.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { cohortId } = body

    let results: any[] = []
    const startTime = Date.now()

    if (cohortId) {
      // Recalculate badges for specific cohort
      console.log(`[badge-maintenance] Starting badge recalculation for cohort ${cohortId}`)
      
      const { data: enrollments } = await supabaseAdmin
        .from('enrollments')
        .select('clerk_user_id')
        .eq('cohort_id', cohortId)
        .eq('status', 'active')

      if (!enrollments || enrollments.length === 0) {
        return NextResponse.json({ error: 'No active students found in cohort' }, { status: 404 })
      }

      let successCount = 0
      for (const enrollment of enrollments) {
        try {
          const newBadges = await checkAndAwardBadges(enrollment.clerk_user_id, cohortId)
          if (newBadges.length > 0) {
            successCount++
            results.push({ 
              userId: enrollment.clerk_user_id, 
              status: 'success', 
              newBadges: newBadges.length 
            })
          }
        } catch (error) {
          console.error(`[badge-maintenance] Error for user ${enrollment.clerk_user_id}:`, error)
          results.push({ 
            userId: enrollment.clerk_user_id, 
            status: 'error', 
            error: 'Failed to calculate badges' 
          })
        }
      }

      const executionTime = Date.now() - startTime
      return NextResponse.json({ 
        success: true, 
        message: `Badge recalculation completed for cohort ${cohortId}`,
        cohortId,
        totalStudents: enrollments.length,
        studentsUpdated: successCount,
        executionTimeMs: executionTime,
        results 
      })
    } else {
      // Recalculate badges for all active cohorts
      const { data: cohorts } = await supabaseAdmin
        .from('cohorts')
        .select('id')
        .eq('status', 'active')

      if (!cohorts || cohorts.length === 0) {
        return NextResponse.json({ error: 'No active cohorts found' }, { status: 404 })
      }

      let totalStudents = 0
      let totalUpdated = 0

      for (const cohort of cohorts) {
        try {
          const { data: enrollments } = await supabaseAdmin
            .from('enrollments')
            .select('clerk_user_id')
            .eq('cohort_id', cohort.id)
            .eq('status', 'active')

          if (enrollments) {
            totalStudents += enrollments.length
            
            for (const enrollment of enrollments) {
              try {
                const newBadges = await checkAndAwardBadges(enrollment.clerk_user_id, cohort.id)
                if (newBadges.length > 0) {
                  totalUpdated++
                }
              } catch (error) {
                console.error(`[badge-maintenance] Error for user ${enrollment.clerk_user_id}:`, error)
              }
            }
          }

          results.push({ 
            cohortId: cohort.id, 
            status: 'success', 
            students: enrollments?.length || 0 
          })
        } catch (error) {
          console.error(`[badge-maintenance] Error for cohort ${cohort.id}:`, error)
          results.push({ 
            cohortId: cohort.id, 
            status: 'error', 
            error: 'Failed to process cohort' 
          })
        }
      }

      const executionTime = Date.now() - startTime
      return NextResponse.json({ 
        success: true, 
        message: 'Badge recalculation completed for all cohorts',
        totalCohorts: cohorts.length,
        totalStudents,
        studentsUpdated: totalUpdated,
        executionTimeMs: executionTime,
        results 
      })
    }
  } catch (error: any) {
    console.error('[POST /api/admin/maintenance/badges] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
