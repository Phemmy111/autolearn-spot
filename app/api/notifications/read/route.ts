import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { notificationIds, markAll } = body

    if (markAll) {
      // Mark all unread notifications as read
      const { error } = await supabaseAdmin
        .from('notification_deliveries')
        .update({ status: 'read', read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('status', 'unread')

      if (error) throw error
    } else if (notificationIds && Array.isArray(notificationIds) && notificationIds.length > 0) {
      // Mark specific notifications as read
      const { error } = await supabaseAdmin
        .from('notification_deliveries')
        .update({ status: 'read', read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .in('notification_id', notificationIds)
        .eq('status', 'unread')

      if (error) throw error
    } else {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Mark read error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
