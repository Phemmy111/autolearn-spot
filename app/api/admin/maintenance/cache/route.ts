import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/maintenance/cache
 * 
 * Clear analytics cache for a cohort, user, or all caches
 */
export async function POST(request: Request) {
  try {
    await requireAdmin()

    const body = await request.json().catch(() => ({}))
    const { cohortId, userId: targetUserId, clearAll } = body

    if (!cohortId && !targetUserId && !clearAll) {
      return NextResponse.json({ error: 'At least one parameter required: cohortId, userId, or clearAll' }, { status: 400 })
    }

    const startTime = Date.now()
    let message = ''
    let details: any = {}

    if (clearAll) {
      // Clear all caches
      console.log('[cache-maintenance] Clearing all caches')
      
      // Clear all cohort caches by revalidating paths
      const { data: cohorts } = await supabaseAdmin
        .from('cohorts')
        .select('id')
        .eq('status', 'active')

      if (cohorts) {
        for (const cohort of cohorts) {
          revalidatePath(`/admin/analytics/progress?cohort=${cohort.id}`)
          revalidatePath(`/dashboard/analytics?cohort=${cohort.id}`)
        }
      }

      // Revalidate common paths
      revalidatePath('/admin/analytics/progress')
      revalidatePath('/dashboard/analytics')
      revalidatePath('/api/analytics')
      revalidatePath('/admin/leaderboard')
      revalidatePath('/leaderboard')

      message = 'All caches cleared'
      details = {
        cohortsProcessed: cohorts?.length || 0
      }
    } else if (cohortId) {
      // Clear cache for specific cohort
      console.log(`[cache-maintenance] Clearing cache for cohort ${cohortId}`)
      
      revalidatePath(`/admin/analytics/progress?cohort=${cohortId}`)
      revalidatePath(`/dashboard/analytics?cohort=${cohortId}`)
      revalidatePath('/admin/analytics/progress')
      revalidatePath('/dashboard/analytics')
      revalidatePath('/admin/leaderboard')
      revalidatePath('/leaderboard')
      
      message = `Cache cleared for cohort ${cohortId}`
      details = { cohortId }
    } else if (targetUserId) {
      // Clear cache for specific user
      console.log(`[cache-maintenance] Clearing cache for user ${targetUserId}`)
      
      // Get user's cohort
      const { data: userEnrollment } = await supabaseAdmin
        .from('enrollments')
        .select('cohort_id')
        .eq('clerk_user_id', targetUserId)
        .eq('status', 'active')
        .maybeSingle()

      if (userEnrollment?.cohort_id) {
        revalidatePath(`/admin/analytics/progress?cohort=${userEnrollment.cohort_id}`)
        revalidatePath(`/dashboard/analytics?cohort=${userEnrollment.cohort_id}`)
        revalidatePath('/admin/analytics/progress')
        revalidatePath('/dashboard/analytics')
      }

      message = `Cache cleared for user ${targetUserId}`
      details = { userId: targetUserId }
    } else {
      // Default to clearing all caches if no specific target is provided
      console.log('[cache-maintenance] No specific target provided, clearing all caches')
      
      const { data: cohorts } = await supabaseAdmin
        .from('cohorts')
        .select('id')
        .eq('status', 'active')

      if (cohorts) {
        for (const cohort of cohorts) {
          revalidatePath(`/admin/analytics/progress?cohort=${cohort.id}`)
          revalidatePath(`/dashboard/analytics?cohort=${cohort.id}`)
        }
      }

      // Revalidate common paths
      revalidatePath('/admin/analytics/progress')
      revalidatePath('/dashboard/analytics')
      revalidatePath('/api/analytics')
      revalidatePath('/admin/leaderboard')
      revalidatePath('/leaderboard')

      message = 'All caches cleared (default)'
      details = {
        cohortsProcessed: cohorts?.length || 0
      }
    }

    const executionTime = Date.now() - startTime
    return NextResponse.json({ 
      success: true, 
      message,
      details,
      executionTimeMs: executionTime
    })
  } catch (error: any) {
    console.error('[POST /api/admin/maintenance/cache] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
