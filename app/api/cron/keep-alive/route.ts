import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Public keep-alive endpoint — called by an external cron service (e.g. cron-job.org)
// every 3 days to prevent Supabase from pausing the project due to inactivity.
// This endpoint is safe to be public — it only reads a count.
export async function GET() {
  try {
    const { count, error } = await supabaseAdmin
      .from('courses')
      .select('*', { count: 'exact', head: true })

    if (error) throw error

    const now = new Date().toISOString()
    console.log(`[Keep-Alive] AutoLearnSpot Supabase pinged at ${now}. Courses: ${count}`)

    return NextResponse.json({
      success: true,
      pingedAt: now,
      courseCount: count,
    })
  } catch (err: any) {
    // Try a simpler fallback query if courses table doesn't exist
    try {
      const { count } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
      return NextResponse.json({ success: true, pingedAt: new Date().toISOString(), userCount: count })
    } catch {
      console.error('[Keep-Alive] Error:', err)
      return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
  }
}
