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

    let { data: preferences, error } = await supabaseAdmin
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code === 'PGRST116') {
      // Not found, create default preferences
      const { data: newPreferences, error: insertError } = await supabaseAdmin
        .from('notification_preferences')
        .insert({ user_id: userId })
        .select()
        .single()
        
      if (insertError) throw insertError
      preferences = newPreferences
    } else if (error) {
      throw error
    }

    return NextResponse.json({ preferences })
  } catch (error: any) {
    console.error('Preferences fetch error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    // Extract only valid preference fields
    const { 
      assignment_updates, 
      quiz_notifications, 
      live_class_notifications, 
      email_notifications, 
      announcement_notifications 
    } = body

    const updateData: any = { updated_at: new Date().toISOString() }
    
    if (assignment_updates !== undefined) updateData.assignment_updates = assignment_updates
    if (quiz_notifications !== undefined) updateData.quiz_notifications = quiz_notifications
    if (live_class_notifications !== undefined) updateData.live_class_notifications = live_class_notifications
    if (email_notifications !== undefined) updateData.email_notifications = email_notifications
    if (announcement_notifications !== undefined) updateData.announcement_notifications = announcement_notifications

    const { data: preferences, error } = await supabaseAdmin
      .from('notification_preferences')
      .upsert({ user_id: userId, ...updateData }, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ preferences })
  } catch (error: any) {
    console.error('Preferences update error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
