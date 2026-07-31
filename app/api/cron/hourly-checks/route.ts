import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendContentUnlockNotification } from '@/lib/notification-scheduler'
import { getCurrentCohortId } from '@/lib/progress-service'

export async function GET() {
  try {
    console.log('[Cron] Starting hourly checks')
    
    const cohortId = await getCurrentCohortId()
    const now = new Date()
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)
    
    // Get lessons that become available in the next hour
    const { data: upcomingLessons } = await supabaseAdmin
      .from('lessons')
      .select('id, title, week_number')
      .eq('cohort_id', cohortId)
      .gte('available_at', now.toISOString())
      .lte('available_at', oneHourLater.toISOString())
      .order('available_at', { ascending: true })
    
    if (!upcomingLessons || upcomingLessons.length === 0) {
      console.log('[Cron] No upcoming lessons in the next hour')
      return NextResponse.json({ success: true, message: 'No upcoming lessons' })
    }
    
    // Get all active enrollments
    const { data: enrollments } = await supabaseAdmin
      .from('enrollments')
      .select('clerk_user_id')
      .eq('cohort_id', cohortId)
      .eq('status', 'active')
    
    if (!enrollments || enrollments.length === 0) {
      console.log('[Cron] No active enrollments found')
      return NextResponse.json({ success: true, message: 'No enrollments to process' })
    }
    
    let successCount = 0
    let errorCount = 0
    
    for (const lesson of upcomingLessons) {
      for (const enrollment of enrollments) {
        if (enrollment.clerk_user_id) {
          try {
            await sendContentUnlockNotification(
              enrollment.clerk_user_id,
              cohortId,
              'lesson',
              lesson.title,
              `/dashboard/video/${lesson.id}`
            )
            successCount++
          } catch (error) {
            console.error(`[Cron] Failed to send notification to ${enrollment.clerk_user_id}:`, error)
            errorCount++
          }
        }
      }
    }
    
    console.log(`[Cron] Completed: ${successCount} successful, ${errorCount} failed`)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Hourly checks completed',
      stats: { success: successCount, failed: errorCount, lessons: upcomingLessons.length }
    })
    
  } catch (error) {
    console.error('[Cron] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}