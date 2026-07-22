import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { auth } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// GET - Student only: Get assignments for current cohort
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current cohort (is_current = true)
    const { data: cohort, error: cohortError } = await supabase
      .from('cohorts')
      .select('id')
      .eq('is_current', true)
      .single()

    if (cohortError || !cohort) {
      return NextResponse.json({ error: 'No active cohort found' }, { status: 404 })
    }

    // Get assignments for current cohort with user's submissions
    const { data: assignments, error } = await supabase
      .from('assignments')
      .select(`
        *,
        submissions (
          id,
          live_url,
          notes,
          status,
          ai_score,
          ai_feedback,
          created_at,
          updated_at
        )
      `)
      .eq('cohort_id', cohort.id)
      .order('week_number', { ascending: true })
      .order('order_index', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Filter submissions to only show current user's
    const assignmentsWithUserSubmissions = assignments?.map(assignment => ({
      ...assignment,
      submissions: assignment.submissions?.filter((s: any) => s.user_id === userId) || []
    })) || []

    return NextResponse.json({ assignments: assignmentsWithUserSubmissions })
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
