import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { videos, isVideoAvailable } from '@/data/videos'

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ enabled: false, eligible: false })
    }

    const { searchParams } = new URL(request.url)
    const courseSlug = searchParams.get('courseSlug') || 'ai-automation-bootcamp'

    // Check if certificate is enabled (course-specific or global)
    const certEnabledKey = `certificate_enabled:${courseSlug}`
    const { data: certSetting } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', certEnabledKey)
      .single()

    let enabled = certSetting?.value
    if (enabled === undefined || enabled === null) {
      const { data: globalSetting } = await supabaseAdmin
        .from('site_settings')
        .select('value')
        .eq('key', 'certificate_enabled')
        .single()
      enabled = globalSetting?.value === true || globalSetting?.value === 'true'
    } else {
      enabled = enabled === true || enabled === 'true'
    }

    // Check if student has unlocked certificates in DB
    const { data: certRecords } = await supabaseAdmin
      .from('certificates')
      .select('*, course_title, learning_product_id, cohorts(name, learning_products(title))')
      .eq('user_id', userId)
      .order('issued_at', { ascending: false })

    const eligible = certRecords && certRecords.length > 0
    const certificates = certRecords || []

    // Get user info for the response
    const user = await currentUser()
    const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username || 'Student'

    return NextResponse.json({
      enabled,
      eligible,
      certificates,
      downloadUrl: eligible && certificates[0] ? `/api/certificate/download?format=pdf&certificateId=${certificates[0].id}` : null,
      totalVideos: videos.length,
      availableVideos: videos.filter(isVideoAvailable).length,
      fullName,
      userId,
    })
  } catch {
    return NextResponse.json({ enabled: false, eligible: false })
  }
}
