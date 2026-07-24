import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { count, error } = await supabaseAdmin
      .from('notification_deliveries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'unread')

    if (error) {
      console.error('Error fetching unread count:', error)
      return NextResponse.json({ error: 'Failed to fetch unread count' }, { status: 500 })
    }

    return NextResponse.json({ unreadCount: count || 0 })
  } catch (error: any) {
    console.error('Unread count fetch error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
