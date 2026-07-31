import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendLiveClassReminder } from '@/lib/notification-scheduler'
import { getCurrentCohortId } from '@/lib/progress-service'

export async function GET() {
  try {
    console.log('[Cron] Starting live class reminders check')
    
    const cohortId = await getCurrentCohortId()
    
    // Get all active enrollments
    const { data: enrollments } = await supabaseAdmin
      .from('enrollments')
      .select('clerk_user_id, email')
      .eq('cohort_id', cohortId)
      .eq('status', 'active')
    
    if (!enrollments || enrollments.length === 0) {
      console.log('[Cron] No active enrollments found')
      return NextResponse.json({ success: true, message: 'No enrollments to process' })
    }
    
    const liveClassConfig = {
      day: 'Saturday',
      startTime: '20:00', // 8:00 PM WAT
      timezone: 'Africa/Lagos'
    }
    
    // Get current time in WAT
    const now = new Date()
    const watOptions = { timeZone: liveClassConfig.timezone }
    const watNow = new Date(now.toLocaleString('en-US', watOptions))
    
    const currentDay = watNow.toLocaleDateString('en-US', { weekday: 'long' })
    const currentHour = watNow.getHours()
    const currentMinute = watNow.getMinutes()
    
    console.log(`[Cron] Current WAT time: ${currentDay} ${currentHour}:${currentMinute}`)
    
    // Only run on Saturday
    if (currentDay !== liveClassConfig.day) {
      console.log('[Cron] Not Saturday, skipping')
      return NextResponse.json({ success: true, message: 'Not Saturday, skipping' })
    }
    
    const [classHour, classMinute] = liveClassConfig.startTime.split(':').map(Number)
    const classTimeInMinutes = classHour * 60 + classMinute
    const currentTimeInMinutes = currentHour * 60 + currentMinute
    
    const timeDiff = classTimeInMinutes - currentTimeInMinutes
    
    let reminderType: '24h' | '3h' | '30m' | 'start' | null = null
    
    // Saturday 8PM = 20:00 = 1200 minutes
    // 24h before = Saturday 8PM previous day = Friday 8PM = 1200 minutes on Friday
    // 3h before = Saturday 5PM = 17:00 = 1020 minutes
    // 30m before = Saturday 7:30PM = 19:30 = 1170 minutes
    // Start = Saturday 8PM = 20:00 = 1200 minutes
    
    if (timeDiff === 0) {
      reminderType = 'start'
    } else if (timeDiff === 30) {
      reminderType = '30m'
    } else if (timeDiff === 180) {
      reminderType = '3h'
    } else if (currentDay === 'Friday' && currentHour === 20 && currentMinute === 0) {
      reminderType = '24h'
    }
    
    if (!reminderType) {
      console.log(`[Cron] No reminder scheduled for current time (diff: ${timeDiff} minutes)`)
      return NextResponse.json({ success: true, message: 'No reminder scheduled for current time' })
    }
    
    console.log(`[Cron] Sending ${reminderType} reminder to ${enrollments.length} students`)
    
    let successCount = 0
    let errorCount = 0
    
    for (const enrollment of enrollments) {
      if (enrollment.clerk_user_id) {
        try {
          await sendLiveClassReminder(enrollment.clerk_user_id, cohortId, reminderType)
          successCount++
        } catch (error) {
          console.error(`[Cron] Failed to send reminder to ${enrollment.clerk_user_id}:`, error)
          errorCount++
        }
      }
    }
    
    console.log(`[Cron] Completed: ${successCount} successful, ${errorCount} failed`)
    
    return NextResponse.json({ 
      success: true, 
      message: `Sent ${reminderType} reminders`,
      stats: { success: successCount, failed: errorCount, total: enrollments.length }
    })
    
  } catch (error) {
    console.error('[Cron] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}