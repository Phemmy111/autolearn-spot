import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export async function GET(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const status = url.searchParams.get('status') // 'unread', 'read', 'archived'

    let query = supabaseAdmin
      .from('notification_deliveries')
      .select('*, notification:notifications(*)')
      .eq('user_id', userId)

    if (status === 'archived') {
      // Assuming 'archived' means deleted_at is not null, or we just rely on status='archived' if we add it.
      // Wait, we didn't add 'archived' to status check in SQL. We can just use 'read' and 'unread' for now, 
      // or filter based on a UI preference. The simplest is to fetch all active ones.
      query = query.neq('status', 'failed')
    } else if (status) {
      query = query.eq('status', status)
    } else {
      // By default, fetch unread and read (not archived/deleted)
      query = query.in('status', ['unread', 'read'])
    }

    // Sort by created_at desc
    query = query.order('created_at', { ascending: false }).limit(50)

    const { data: deliveries, error } = await query

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }

    // Filter out expired or soft-deleted notifications
    const now = new Date().getTime()
    const validDeliveries = deliveries?.filter(d => {
      const notif = d.notification
      if (!notif) return false
      if (notif.deleted_at) return false
      if (notif.expires_at && new Date(notif.expires_at).getTime() < now) return false
      return true
    }) || []

    return NextResponse.json({ notifications: validDeliveries })
  } catch (error: any) {
    console.error('Notifications fetch error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
