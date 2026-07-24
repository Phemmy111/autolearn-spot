import { NextResponse } from 'next/server'
import { requireAdmin, getAdminInfo } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase'
import { createNotification } from '@/lib/notifications'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// GET /api/admin/notifications
export async function GET() {
  try {
    await requireAdmin()

    // Get notifications for admin view
    const { data: notifications, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .is('deleted_at', null)
      .limit(100)

    if (error) {
      console.error('Error fetching admin notifications:', error)
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }

    return NextResponse.json({ notifications })
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/notifications
export async function POST(req: Request) {
  try {
    await requireAdmin()
    const adminInfo = await getAdminInfo()
    const adminEmail = adminInfo?.email || 'System Admin'

    const body = await req.json()
    const { title, message, category, priority, target_type, target_id, action_url, action_label, media_url, icon, expires_at, send_email } = body

    if (!title || !message || !category || !target_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const notification = await createNotification({
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
      send_email,
      created_by: adminEmail
    })

    return NextResponse.json({ success: true, notification }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating notification:', error)
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
