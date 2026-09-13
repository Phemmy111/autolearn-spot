import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET /api/author/students
 * Get all enrolled students for the author's products
 */
export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all enrollments (platform-wide for now since cohorts may not link to products)
    const { data: enrollments, error } = await supabaseAdmin
      .from('enrollments')
      .select('id, email, clerk_user_id, first_name, last_name, full_name, cohort, status, profile_picture, created_at, activated_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[GET /api/author/students] Enrollments error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get quiz response counts per user
    const { data: quizCounts } = await supabaseAdmin
      .from('quiz_responses')
      .select('user_id')

    // Get submission counts per user
    const { data: submissionCounts } = await supabaseAdmin
      .from('submissions')
      .select('user_id')

    // Build count maps
    const quizCountMap: Record<string, number> = {}
    const submissionCountMap: Record<string, number> = {}

    quizCounts?.forEach((qr: any) => {
      quizCountMap[qr.user_id] = (quizCountMap[qr.user_id] || 0) + 1
    })

    submissionCounts?.forEach((s: any) => {
      submissionCountMap[s.user_id] = (submissionCountMap[s.user_id] || 0) + 1
    })

    // Deduplicate by email (keep latest enrollment per email)
    const emailMap = new Map<string, any>()
    for (const enrollment of enrollments || []) {
      const key = enrollment.email
      if (!emailMap.has(key)) {
        const clerkId = enrollment.clerk_user_id || ''
        emailMap.set(key, {
          id: enrollment.id,
          email: enrollment.email,
          name: enrollment.full_name || [enrollment.first_name, enrollment.last_name].filter(Boolean).join(' ') || null,
          cohort: enrollment.cohort,
          status: enrollment.status,
          profilePicture: enrollment.profile_picture,
          enrolledAt: enrollment.created_at,
          activatedAt: enrollment.activated_at,
          quizCount: quizCountMap[clerkId] || 0,
          submissionCount: submissionCountMap[clerkId] || 0,
        })
      }
    }

    const students = Array.from(emailMap.values())

    return NextResponse.json({ success: true, students })
  } catch (error: any) {
    console.error('[GET /api/author/students] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
