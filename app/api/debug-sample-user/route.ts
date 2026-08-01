import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Get current cohort
    const { data: currentCohort } = await supabaseAdmin
      .from('cohorts')
      .select('id')
      .eq('is_current', true)
      .single()

    const cohortId = currentCohort?.id
    if (!cohortId) {
      return NextResponse.json({ error: 'No current cohort found' }, { status: 404 })
    }

    // Get a sample user with enrollment
    const { data: enrollment } = await supabaseAdmin
      .from('enrollments')
      .select('clerk_user_id, email, full_name, first_name, last_name')
      .eq('cohort_id', cohortId)
      .eq('status', 'active')
      .limit(1)
      .single()

    if (!enrollment) {
      return NextResponse.json({ error: 'No active enrollments found' }, { status: 404 })
    }

    // Get counts for this user
    const { data: submissions } = await supabaseAdmin
      .from('submissions')
      .select('id')
      .eq('user_id', enrollment.clerk_user_id)
    
    const { data: lessonProgress } = await supabaseAdmin
      .from('lesson_progress')
      .select('id')
      .eq('user_id', enrollment.clerk_user_id)
      .eq('cohort_id', cohortId)
    
    const { data: quizResponses } = await supabaseAdmin
      .from('quiz_responses')
      .select('id')
      .eq('user_id', enrollment.clerk_user_id)
      .eq('cohort_id', cohortId)

    return NextResponse.json({
      sampleUser: {
        userId: enrollment.clerk_user_id,
        email: enrollment.email,
        name: enrollment.full_name || `${enrollment.first_name} ${enrollment.last_name}`,
        cohortId
      },
      activityCounts: {
        submissions: submissions?.length || 0,
        lessonProgress: lessonProgress?.length || 0,
        quizResponses: quizResponses?.length || 0
      }
    })
  } catch (error: any) {
    console.error('[debug-sample-user] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
