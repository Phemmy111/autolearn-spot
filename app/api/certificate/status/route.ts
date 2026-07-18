import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { videos, isVideoAvailable } from '@/data/videos'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ enabled: false, eligible: false })
    }

    // Check if certificate is enabled
    const { data: setting } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', 'certificate_enabled')
      .single()

    const enabled = setting?.value === true || setting?.value === 'true'

    // Get user info for the response
    const user = await currentUser()
    const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Student'

    return NextResponse.json({
      enabled,
      eligible: false, // Client checks progress via localStorage
      totalVideos: videos.length,
      availableVideos: videos.filter(isVideoAvailable).length,
      fullName,
      userId,
    })
  } catch {
    return NextResponse.json({ enabled: false, eligible: false })
  }
}
