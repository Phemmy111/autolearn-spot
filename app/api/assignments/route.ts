import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { auth } from '@clerk/nextjs/server'
import { getUserCohortId } from '@/lib/progress-service'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// GET - Student only: Get assignments for student's enrolled cohort
export async function GET() {
  try {
    const { userId, email } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get student's enrolled cohort
    const cohortId = await getUserCohortId(userId, email || '')
    console.log('Student cohort:', cohortId)

    // Get assignments for student's cohort with user's submissions
    const { data: assignments, error } = await supabase
      .from('assignments')
      .select(`
        *,
        submissions (
          id,
          user_id,
          live_url,
          screenshot_url,
          notes,
          status,
          ai_score,
          ai_feedback,
          created_at,
          updated_at
        )
      `)
      .eq('cohort_id', cohortId)
      .order('week_number', { ascending: true })
      .order('order_index', { ascending: true })

    if (error) {
      console.error('Error fetching assignments:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('Fetched assignments:', assignments?.length)

    // Filter submissions to only show current user's
    const assignmentsWithUserSubmissions = assignments?.map(assignment => {
      const userSubmissions = assignment.submissions?.filter((s: { user_id: string }) => s.user_id === userId) || []
      console.log(`Assignment ${assignment.id}: ${userSubmissions.length} user submissions`)
      return {
        ...assignment,
        submissions: userSubmissions
      }
    }) || []

    return NextResponse.json({ assignments: assignmentsWithUserSubmissions })
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
