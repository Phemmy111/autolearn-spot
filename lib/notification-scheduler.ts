import { createNotification } from './notifications'
import { supabaseAdmin } from './supabase'
import { logAuditEvent, logSystemError } from './audit-logging'
import { getCurrentCohortId } from './progress-service'
import { getLiveClassTimeForNotification } from '@/config/live-class'

// Reminder types
export type ReminderType = 
  | 'live_class_24h'
  | 'live_class_3h'
  | 'live_class_30m'
  | 'live_class_start'
  | 'content_unlock_module'
  | 'content_unlock_lesson'
  | 'content_unlock_bonus'
  | 'progress_25'
  | 'progress_50'
  | 'progress_75'
  | 'progress_certificate'
  | 'inactivity_5d'
  | 'inactivity_7d'

// Generate deterministic event_id for idempotent notifications
export function generateEventId(type: ReminderType, userId: string, context: string = ''): string {
  const timestamp = new Date().toISOString().split('T')[0] // Date only for daily reminders
  return `${type}_${userId}_${context}_${timestamp}`.replace(/[^a-zA-Z0-9_-]/g, '_')
}

// Live Class Reminders
export async function sendLiveClassReminder(
  userId: string,
  cohortId: string,
  reminderType: '24h' | '3h' | '30m' | 'start'
): Promise<void> {
  try {
    const eventId = generateEventId(`live_class_${reminderType}`, userId, cohortId)
    
    let title: string
    let message: string
    let priority: 'normal' | 'important' | 'urgent' = 'normal'
    
    const classTime = getLiveClassTimeForNotification()
    
    switch (reminderType) {
      case '24h':
        title = 'Live Class Tomorrow'
        message = `Your live class session starts tomorrow at ${classTime}. Don't miss it!`
        priority = 'normal'
        break
      case '3h':
        title = 'Live Class in 3 Hours'
        message = `Your live class session starts in 3 hours at ${classTime}. Get ready!`
        priority = 'important'
        break
      case '30m':
        title = 'Live Class Starting Soon'
        message = `Your live class session starts in 30 minutes at ${classTime}. Join now!`
        priority = 'urgent'
        break
      case 'start':
        title = 'Live Class is Live!'
        message = 'Your live class session has started. Join now to participate!'
        priority = 'urgent'
        break
    }
    
    await createNotification({
      title,
      message,
      category: 'live_class',
      priority,
      target_type: 'student',
      target_id: userId,
      action_url: '/live-class',
      action_label: 'Join Class',
      send_email: reminderType === '24h' || reminderType === '3h',
      event_id: eventId
    })
    
    await logAuditEvent({
      event_type: 'user_activity',
      event_category: 'email_sent',
      event_action: 'live_class_reminder_sent',
      user_id: userId,
      description: `Live class ${reminderType} reminder sent to user`,
      metadata: { reminderType, cohortId }
    })
  } catch (error) {
    await logSystemError({
      action: 'send_live_class_reminder',
      category: 'api_error',
      error_message: error instanceof Error ? error.message : 'Unknown error',
      user_id: userId,
      resource_type: 'notification',
      metadata: { reminderType, cohortId }
    })
    throw error
  }
}

// Content Unlock Notifications
export async function sendContentUnlockNotification(
  userId: string,
  cohortId: string,
  contentType: 'module' | 'lesson' | 'bonus',
  contentTitle: string,
  contentUrl: string
): Promise<void> {
  try {
    const eventId = generateEventId(`content_unlock_${contentType}`, userId, contentTitle)
    
    let title: string
    let message: string
    
    switch (contentType) {
      case 'module':
        title = 'New Module Unlocked'
        message = `A new module "${contentTitle}" is now available for you to explore!`
        break
      case 'lesson':
        title = 'New Lesson Available'
        message = `A new lesson "${contentTitle}" has been released. Continue your learning journey!`
        break
      case 'bonus':
        title = 'Bonus Content Released'
        message = `Bonus content "${contentTitle}" is now available. Don't miss this extra material!`
        break
    }
    
    await createNotification({
      title,
      message,
      category: 'content_unlock',
      priority: 'important',
      target_type: 'student',
      target_id: userId,
      action_url: contentUrl,
      action_label: 'View Content',
      send_email: true,
      event_id: eventId
    })
    
    await logAuditEvent({
      event_type: 'user_activity',
      event_category: 'email_sent',
      event_action: 'content_unlock_notification_sent',
      user_id: userId,
      description: `Content unlock notification sent: ${contentType}`,
      metadata: { contentType, contentTitle, cohortId }
    })
  } catch (error) {
    await logSystemError({
      action: 'send_content_unlock_notification',
      category: 'api_error',
      error_message: error instanceof Error ? error.message : 'Unknown error',
      user_id: userId,
      resource_type: 'notification',
      metadata: { contentType, contentTitle }
    })
    throw error
  }
}

// Progress Milestone Notifications
export async function sendProgressMilestoneNotification(
  userId: string,
  cohortId: string,
  milestone: 25 | 50 | 75 | 100
): Promise<void> {
  try {
    const eventId = generateEventId(`progress_${milestone}`, userId, cohortId)
    
    let title: string
    let message: string
    let priority: 'normal' | 'important' | 'urgent' = 'normal'
    
    switch (milestone) {
      case 25:
        title = '🎉 Great Progress!'
        message = 'Congratulations! You\'ve completed 25% of the course. Keep up the excellent work!'
        priority = 'normal'
        break
      case 50:
        title = '🎉 You\'re Halfway There!'
        message = 'Amazing! You\'ve reached 50% completion. You\'re doing fantastic!'
        priority = 'important'
        break
      case 75:
        title = '🎉 Almost There!'
        message = 'You\'ve reached 75% completion! The finish line is in sight!'
        priority = 'important'
        break
      case 100:
        title = '🏆 Certificate Eligible!'
        message = 'Congratulations! You\'ve completed the course and are eligible for your certificate!'
        priority = 'urgent'
        break
    }
    
    await createNotification({
      title,
      message,
      category: 'progress_milestone',
      priority,
      target_type: 'student',
      target_id: userId,
      action_url: milestone === 100 ? '/certificate' : '/dashboard/analytics',
      action_label: milestone === 100 ? 'Get Certificate' : 'View Progress',
      send_email: true,
      event_id: eventId
    })
    
    await logAuditEvent({
      event_type: 'user_activity',
      event_category: 'email_sent',
      event_action: 'progress_milestone_notification_sent',
      user_id: userId,
      description: `Progress milestone notification sent: ${milestone}%`,
      metadata: { milestone, cohortId }
    })
  } catch (error) {
    await logSystemError({
      action: 'send_progress_milestone_notification',
      category: 'api_error',
      error_message: error instanceof Error ? error.message : 'Unknown error',
      user_id: userId,
      resource_type: 'notification',
      metadata: { milestone, cohortId }
    })
    throw error
  }
}

// Inactivity Re-engagement Notifications
export async function sendInactivityReminder(
  userId: string,
  cohortId: string,
  inactiveDays: 5 | 7
): Promise<void> {
  try {
    const eventId = generateEventId(`inactivity_${inactiveDays}d`, userId, cohortId)
    
    const title = 'We Miss You!'
    const message = `We've noticed you haven't continued your training recently. Continue where you left off and keep your momentum going!`
    
    await createNotification({
      title,
      message,
      category: 'inactivity_reminder',
      priority: inactiveDays === 7 ? 'important' : 'normal',
      target_type: 'student',
      target_id: userId,
      action_url: '/dashboard',
      action_label: 'Continue Learning',
      send_email: true,
      event_id: eventId
    })
    
    await logAuditEvent({
      event_type: 'user_activity',
      event_category: 'email_sent',
      event_action: 'inactivity_reminder_sent',
      user_id: userId,
      description: `Inactivity reminder sent: ${inactiveDays} days`,
      metadata: { inactiveDays, cohortId }
    })
  } catch (error) {
    await logSystemError({
      action: 'send_inactivity_reminder',
      category: 'api_error',
      error_message: error instanceof Error ? error.message : 'Unknown error',
      user_id: userId,
      resource_type: 'notification',
      metadata: { inactiveDays, cohortId }
    })
    throw error
  }
}

// Retry handler for failed notifications
export async function retryFailedNotification(
  notificationId: string,
  maxRetries: number = 3
): Promise<boolean> {
  try {
    const { data: delivery } = await supabaseAdmin
      .from('notification_deliveries')
      .select('*')
      .eq('notification_id', notificationId)
      .eq('status', 'failed')
      .single()
    
    if (!delivery) {
      console.log('No failed delivery found for notification:', notificationId)
      return false
    }
    
    const retryCount = delivery.metadata?.retry_count || 0
    
    if (retryCount >= maxRetries) {
      console.log('Max retries exceeded for notification:', notificationId)
      return false
    }
    
    // Retry logic would go here - re-send the notification
    // For now, just update the retry count
    await supabaseAdmin
      .from('notification_deliveries')
      .update({
        metadata: { ...delivery.metadata, retry_count: retryCount + 1 },
        status: 'pending'
      })
      .eq('id', delivery.id)
    
    await logAuditEvent({
      event_type: 'system_error',
      event_category: 'api_error',
      event_action: 'notification_retry',
      description: `Retrying failed notification delivery`,
      metadata: { notificationId, retryCount: retryCount + 1 }
    })
    
    return true
  } catch (error) {
    console.error('Error retrying notification:', error)
    return false
  }
}

// Batch check for inactive students
export async function checkInactiveStudents(cohortId?: string): Promise<void> {
  try {
    const cid = cohortId || await getCurrentCohortId()
    
    // Get all active students
    const { data: enrollments } = await supabaseAdmin
      .from('enrollments')
      .select('clerk_user_id, email')
      .eq('cohort_id', cid)
      .eq('status', 'active')
    
    if (!enrollments || enrollments.length === 0) return
    
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    
    for (const enrollment of enrollments) {
      const userId = enrollment.clerk_user_id || enrollment.email
      
      // Get last login activity
      const { data: lastActivity } = await supabaseAdmin
        .from('login_activity')
        .select('login_time')
        .eq('user_id', userId)
        .order('login_time', { ascending: false })
        .limit(1)
        .single()
      
      if (!lastActivity?.login_time) continue
      
      const lastLoginDate = new Date(lastActivity.login_time)
      const daysInactive = Math.floor((Date.now() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24))
      
      // Send 5-day reminder
      if (daysInactive === 5) {
        await sendInactivityReminder(userId, cid, 5)
      }
      
      // Send 7-day reminder
      if (daysInactive === 7) {
        await sendInactivityReminder(userId, cid, 7)
      }
    }
  } catch (error) {
    await logSystemError({
      action: 'check_inactive_students',
      category: 'api_error',
      error_message: error instanceof Error ? error.message : 'Unknown error',
      resource_type: 'notification',
      metadata: { cohortId }
    })
  }
}

// Batch check for progress milestones
export async function checkProgressMilestones(cohortId?: string): Promise<void> {
  try {
    const cid = cohortId || await getCurrentCohortId()
    
    // Get all active students
    const { data: enrollments } = await supabaseAdmin
      .from('enrollments')
      .select('clerk_user_id, email')
      .eq('cohort_id', cid)
      .eq('status', 'active')
    
    if (!enrollments || enrollments.length === 0) return
    
    const { count: totalLessons } = await supabaseAdmin
      .from('lessons')
      .select('id', { count: 'exact', head: true })
      .eq('cohort_id', cid)
    
    if (!totalLessons || totalLessons === 0) return
    
    for (const enrollment of enrollments) {
      const userId = enrollment.clerk_user_id || enrollment.email
      
      // Get completed lessons count
      const { count: completedLessons } = await supabaseAdmin
        .from('lesson_progress')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('cohort_id', cid)
        .eq('completed', true)
      
      const progressPercentage = Math.round(((completedLessons || 0) / totalLessons) * 100)
      
      // Check milestones and send notifications
      if (progressPercentage >= 25 && progressPercentage < 50) {
        await sendProgressMilestoneNotification(userId, cid, 25)
      } else if (progressPercentage >= 50 && progressPercentage < 75) {
        await sendProgressMilestoneNotification(userId, cid, 50)
      } else if (progressPercentage >= 75 && progressPercentage < 100) {
        await sendProgressMilestoneNotification(userId, cid, 75)
      } else if (progressPercentage === 100) {
        await sendProgressMilestoneNotification(userId, cid, 100)
      }
    }
  } catch (error) {
    await logSystemError({
      action: 'check_progress_milestones',
      category: 'api_error',
      error_message: error instanceof Error ? error.message : 'Unknown error',
      resource_type: 'notification',
      metadata: { cohortId }
    })
  }
}
