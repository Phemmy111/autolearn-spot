import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    await requireAdmin()

    const body = await request.json().catch(() => ({}))
    const { cohortId, userId: targetUserId, clearAll } = body

    if (!cohortId && !targetUserId && !clearAll) {
      return NextResponse.json({ error: 'At least one parameter required: cohortId, userId, or clearAll' }, { status: 400 })
    }

    const startTime = Date.now()
    let results: any[] = []
    
    let studentsProcessed = 0
    let studentsSucceeded = 0
    let studentsFailed = 0
    let cacheCleared = 0
    
    let scope = 'all-caches'

    if (clearAll) {
      console.log('[maintenance] [cache-clear] Clearing all caches')
      
      const { data: cohorts, error: cohortError } = await supabaseAdmin
        .from('cohorts')
        .select('id')
        .eq('status', 'active')
        
      if (cohortError) {
        console.error(`[maintenance] [cache-clear] DB Error fetching cohorts:`, cohortError)
      } else if (cohorts) {
        for (const cohort of cohorts) {
          revalidatePath(`/admin/analytics/progress?cohort=${cohort.id}`)
          revalidatePath(`/dashboard/analytics?cohort=${cohort.id}`)
          cacheCleared += 2
        }
      }

      revalidatePath('/admin/analytics/progress')
      revalidatePath('/dashboard/analytics')
      revalidatePath('/api/analytics')
      revalidatePath('/admin/leaderboard')
      revalidatePath('/leaderboard')
      cacheCleared += 5

      results.push({ message: 'All caches cleared', cohortsProcessed: cohorts?.length || 0 })
      scope = 'all-caches'
    } else if (cohortId) {
      console.log(`[maintenance] [cache-clear] Clearing cache for cohort ${cohortId}`)
      
      revalidatePath(`/admin/analytics/progress?cohort=${cohortId}`)
      revalidatePath(`/dashboard/analytics?cohort=${cohortId}`)
      revalidatePath('/admin/analytics/progress')
      revalidatePath('/dashboard/analytics')
      revalidatePath('/admin/leaderboard')
      revalidatePath('/leaderboard')
      cacheCleared += 6
      
      results.push({ message: `Cache cleared for cohort ${cohortId}`, cohortId })
      scope = 'cohort'
    } else if (targetUserId) {
      console.log(`[maintenance] [cache-clear] Clearing cache for user ${targetUserId}`)
      
      const { data: userEnrollment, error: enrollError } = await supabaseAdmin
        .from('enrollments')
        .select('cohort_id')
        .eq('clerk_user_id', targetUserId)
        .eq('status', 'active')
        .maybeSingle()

      if (enrollError) {
        console.error(`[maintenance] [cache-clear] DB Error fetching enrollment for user ${targetUserId}:`, enrollError)
      } else if (userEnrollment?.cohort_id) {
        revalidatePath(`/admin/analytics/progress?cohort=${userEnrollment.cohort_id}`)
        revalidatePath(`/dashboard/analytics?cohort=${userEnrollment.cohort_id}`)
        revalidatePath('/admin/analytics/progress')
        revalidatePath('/dashboard/analytics')
        cacheCleared += 4
      }

      results.push({ message: `Cache cleared for user ${targetUserId}`, userId: targetUserId })
      scope = 'user'
    } else {
      console.log('[maintenance] [cache-clear] No specific target provided, clearing all caches (fallback)')
      
      const { data: cohorts, error: cohortError } = await supabaseAdmin
        .from('cohorts')
        .select('id')
        .eq('status', 'active')

      if (cohortError) {
        console.error(`[maintenance] [cache-clear] DB Error fetching cohorts:`, cohortError)
      } else if (cohorts) {
        for (const cohort of cohorts) {
          revalidatePath(`/admin/analytics/progress?cohort=${cohort.id}`)
          revalidatePath(`/dashboard/analytics?cohort=${cohort.id}`)
          cacheCleared += 2
        }
      }

      revalidatePath('/admin/analytics/progress')
      revalidatePath('/dashboard/analytics')
      revalidatePath('/api/analytics')
      revalidatePath('/admin/leaderboard')
      revalidatePath('/leaderboard')
      cacheCleared += 5

      results.push({ message: 'All caches cleared (default)', cohortsProcessed: cohorts?.length || 0 })
      scope = 'all-caches'
    }

    const executionTimeMs = Date.now() - startTime
    
    const responsePayload: any = { 
      success: true,
      operation: 'cache-clear',
      scope,
      executionTimeMs,
      studentsProcessed,
      studentsSucceeded,
      studentsFailed,
      cacheCleared,
      results
    }
    
    if (cohortId) {
      responsePayload.cohortId = cohortId
    }

    return NextResponse.json(responsePayload)
  } catch (error: any) {
    console.error('[maintenance] [cache-clear] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
