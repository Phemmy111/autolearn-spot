import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendInactivityReminder } from '@/lib/notification-scheduler'
import { getCurrentCohortId } from '@/lib/progress-service'

export async function GET() {
  try {
    console.log('[Cron] Starting daily checks')
    
    const cohortId = await getCurrentCohortId()
    
    // Get all active enrollments
    const { data: enrollments } = await supabaseAdmin
      .from('enrollments')
      .select('clerk_user_id, email, created_at')
      .eq('cohort_id', cohortId)
      .eq('status', 'active')
    
    if (!enrollments || enrollments.length === 0) {
      console.log('[Cron] No active enrollments found')
      return NextResponse.json({ success: true, message: 'No enrollments to process' })
    }
    
    const now = new Date()
    let successCount = 0
    let errorCount = 0
    
    for (const enrollment of enrollments) {
      if (!enrollment.clerk_user_id) continue
      
      try {
        const enrollmentDate = new Date(enrollment.created_at)
        const daysSinceEnrollment = Math.floor((now.getTime() - enrollmentDate.getTime()) / (1000 * 60 * 60 * 24))
        
        // Check for 5-day inactivity
        if (daysSinceEnrollment === 5) {
          await sendInactivityReminder(enrollment.clerk_user_id, cohortId, 5)
          successCount++
        }
        
        // Check for 7-day inactivity
        if (daysSinceEnrollment === 7) {
          await sendInactivityReminder(enrollment.clerk_user_id, cohortId, 7)
          successCount++
        }
        
      } catch (error) {
        console.error(`[Cron] Failed to process ${enrollment.clerk_user_id}:`, error)
        errorCount++
      }
    }
    
    console.log(`[Cron] Completed: ${successCount} successful, ${errorCount} failed`)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Daily checks completed',
      stats: { success: successCount, failed: errorCount, total: enrollments.length }
    })
    
  } catch (error) {
    console.error('[Cron] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}