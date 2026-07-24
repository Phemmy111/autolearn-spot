import { supabaseAdmin } from './supabase'
import { sendEmail } from '@/utils/email'

export type NotificationCategory = 'announcement' | 'assignment' | 'assignment_review' | 'quiz' | 'payment' | 'enrollment' | 'certificate' | 'live_class' | 'system'
export type NotificationPriority = 'normal' | 'important' | 'urgent'
export type NotificationTarget = 'all' | 'cohort' | 'student'

export interface CreateNotificationParams {
  title: string
  message: string
  category: NotificationCategory
  priority?: NotificationPriority
  target_type: NotificationTarget
  target_id?: string // null for 'all', cohort_id for 'cohort', user_id for 'student'
  action_url?: string
  action_label?: string
  media_url?: string
  icon?: string
  expires_at?: string
  created_by?: string
  send_email?: boolean
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    const { 
      title, message, category, priority = 'normal', 
      target_type, target_id, action_url, action_label, 
      media_url, icon, expires_at, created_by, send_email = false 
    } = params

    // 1. Resolve Target Users
    let targetUsers: { id: string, email: string, name?: string }[] = []

    if (target_type === 'student' && target_id) {
      // Find the student email/name from enrollments (target_id can be clerk_id or email)
      const { data: enrollment } = await supabaseAdmin
        .from('enrollments')
        .select('email, clerk_user_id')
        .or(`clerk_user_id.eq.${target_id},email.eq.${target_id}`)
        .single()
      
      if (enrollment) {
        targetUsers.push({ id: enrollment.clerk_user_id || target_id, email: enrollment.email })
      } else {
        // Fallback for system notifications
        targetUsers.push({ id: target_id, email: target_id.includes('@') ? target_id : '' })
      }
    } else if (target_type === 'cohort' && target_id) {
      const { data: enrollments } = await supabaseAdmin
        .from('enrollments')
        .select('email, clerk_user_id')
        .eq('cohort_id', target_id)
        .eq('status', 'active')
      
      if (enrollments) {
        targetUsers = enrollments
          .filter(e => e.clerk_user_id)
          .map(e => ({ id: e.clerk_user_id!, email: e.email }))
      }
    } else if (target_type === 'all') {
      const { data: enrollments } = await supabaseAdmin
        .from('enrollments')
        .select('email, clerk_user_id')
        .eq('status', 'active')
      
      if (enrollments) {
        targetUsers = enrollments
          .filter(e => e.clerk_user_id)
          .map(e => ({ id: e.clerk_user_id!, email: e.email }))
      }
    }

    const recipientCount = targetUsers.length

    // 2. Create the Notification
    const { data: notification, error: notifError } = await supabaseAdmin
      .from('notifications')
      .insert({
        title,
        message,
        category,
        priority,
        target_type,
        target_id,
        action_url,
        action_label,
        media_url,
        icon,
        expires_at,
        created_by,
        recipient_count: recipientCount,
        delivery_summary: { in_app_sent: recipientCount, email_sent: 0 }
      })
      .select()
      .single()

    if (notifError) throw notifError

    // 3. Create Deliveries
    if (recipientCount > 0) {
      const deliveries = targetUsers.map(user => ({
        notification_id: notification.id,
        user_id: user.id,
        channel: 'in_app',
        status: 'unread'
      }))

      // Batch insert deliveries
      const { error: deliveryError } = await supabaseAdmin
        .from('notification_deliveries')
        .insert(deliveries)

      if (deliveryError) {
        console.error('Error creating notification deliveries:', deliveryError)
      }
    }

    // 4. Send Emails if requested
    let emailSentCount = 0
    if (send_email && targetUsers.length > 0) {
      // Get user preferences to filter out those who opted out
      const userIds = targetUsers.map(u => u.id)
      const { data: preferences } = await supabaseAdmin
        .from('notification_preferences')
        .select('user_id, email_notifications')
        .in('user_id', userIds)
      
      const optedOutUsers = new Set(
        preferences?.filter(p => p.email_notifications === false).map(p => p.user_id) || []
      )

      for (const user of targetUsers) {
        if (!user.email || optedOutUsers.has(user.id)) continue;
        
        try {
          const actionHtml = action_url 
            ? `<div style="margin-top:20px;"><a href="${action_url}" style="background-color:#00f0ff; color:#000; padding:10px 20px; text-decoration:none; font-weight:bold; border-radius:4px;">${action_label || 'View'}</a></div>` 
            : '';
            
          await sendEmail({
            to: user.email,
            subject: title,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <h2>${title}</h2>
                <p>${message}</p>
                ${actionHtml}
                <hr style="margin-top:30px; border:none; border-top:1px solid #eee;" />
                <p style="font-size:12px; color:#999;">You are receiving this because of your enrollment in AutoLearn Spot. To manage your notification preferences, visit your dashboard settings.</p>
              </div>
            `
          })
          emailSentCount++
        } catch (err) {
          console.error(`Failed to send email to ${user.email}`, err)
        }
      }

      // Update summary
      await supabaseAdmin
        .from('notifications')
        .update({
          delivery_summary: { in_app_sent: recipientCount, email_sent: emailSentCount }
        })
        .eq('id', notification.id)
    }

    return notification
  } catch (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}
