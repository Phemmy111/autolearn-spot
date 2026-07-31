import { NextResponse } from 'next/server'
import { requireAdmin, getAdminInfo } from '@/lib/admin'
import { 
  sendLiveClassReminder,
  sendContentUnlockNotification,
  sendProgressMilestoneNotification,
  sendInactivityReminder,
  checkInactiveStudents,
  checkProgressMilestones
} from '@/lib/notification-scheduler'
import { getCurrentCohortId } from '@/lib/progress-service'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// POST /api/admin/notifications/schedule
export async function POST(req: Request) {
  try {
    await requireAdmin()
    const adminInfo = await getAdminInfo()
    const adminEmail = adminInfo?.email || 'System Admin'

    const body = await req.json()
    const { 
      action, 
      userId, 
      cohortId, 
      reminderType, 
      contentType, 
      contentTitle, 
      contentUrl,
      milestone,
      inactiveDays 
    } = body

    const cid = cohortId || await getCurrentCohortId()

    switch (action) {
      case 'live_class_reminder':
        if (!userId || !reminderType) {
          return NextResponse.json({ error: 'Missing userId or reminderType' }, { status: 400 })
        }
        await sendLiveClassReminder(userId, cid, reminderType)
        break

      case 'content_unlock':
        if (!userId || !contentType || !contentTitle || !contentUrl) {
          return NextResponse.json({ error: 'Missing required fields for content unlock' }, { status: 400 })
        }
        await sendContentUnlockNotification(userId, cid, contentType, contentTitle, contentUrl)
        break

      case 'progress_milestone':
        if (!userId || !milestone) {
          return NextResponse.json({ error: 'Missing userId or milestone' }, { status: 400 })
        }
        await sendProgressMilestoneNotification(userId, cid, milestone)
        break

      case 'inactivity_reminder':
        if (!userId || !inactiveDays) {
          return NextResponse.json({ error: 'Missing userId or inactiveDays' }, { status: 400 })
        }
        await sendInactivityReminder(userId, cid, inactiveDays)
        break

      case 'check_inactive_students':
        await checkInactiveStudents(cid)
        break

      case 'check_progress_milestones':
        await checkProgressMilestones(cid)
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Notification sent successfully' }, { status: 200 })
  } catch (error: any) {
    console.error('Error sending scheduled notification:', error)
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
