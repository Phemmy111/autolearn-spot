import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// Public keep-alive endpoint — called by Vercel cron or external monitor
// to prevent Supabase from pausing the project due to inactivity.
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { count, error } = await supabaseAdmin
      .from('learning_products')
      .select('*', { count: 'exact', head: true })

    if (error) throw error

    const now = new Date().toISOString()
    console.log(`[Keep-Alive] AutoLearnSpot Supabase pinged at ${now}. Products: ${count}`)

    return NextResponse.json({
      success: true,
      pingedAt: now,
      productCount: count,
      status: 'active'
    })
  } catch (err: any) {
    try {
      const { count } = await supabaseAdmin
        .from('lessons')
        .select('*', { count: 'exact', head: true })
      return NextResponse.json({ success: true, pingedAt: new Date().toISOString(), lessonCount: count })
    } catch (fallbackErr: any) {
      console.error('[Keep-Alive] Error:', err)
      return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
  }
}
