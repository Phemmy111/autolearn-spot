import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { auth } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// GET - Student only: Get assignments for student's enrolled cohort
export async function GET(request: Request) {
  try {
    const { userId, email } = await auth()
    console.log('[GET /api/assignments] Auth values:', { userId, email });
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const urlParams = new URL(request.url).searchParams
    const assignmentId = urlParams.get('assignment')

    if (assignmentId) {
      // Fetch single assignment by ID
      const { data: assignment, error } = await supabase
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
        .eq('id', assignmentId)
        .single()

      if (error || !assignment) {
        console.error('Error fetching assignment:', error)
        return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
      }

      // Filter submissions to only show current user's
      const userSubmissions = assignment.submissions?.filter((s: { user_id: string }) => s.user_id === userId) || []
      
      return NextResponse.json({ 
        assignment: {
          ...assignment,
          submissions: userSubmissions
        }
      })
    }

    // Simplified: Get all assignments without cohort filter
    const { data: allAssignments, error } = await supabase
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
      .order('order_index', { ascending: true })

    console.log('[GET /api/assignments] Query result:', { 
      assignmentCount: allAssignments?.length || 0, 
      error: error?.message 
    });

    if (error) {
      console.error('Error fetching assignments:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!allAssignments || allAssignments.length === 0) {
      return NextResponse.json({ assignments: [] })
    }

    console.log('Fetched assignments:', allAssignments.length)

    // Filter submissions to only show current user's
    const assignmentsWithUserSubmissions = allAssignments.map(assignment => {
      const userSubmissions = assignment.submissions?.filter((s: { user_id: string }) => s.user_id === userId) || []
      console.log(`Assignment ${assignment.id}: ${userSubmissions.length} user submissions`)
      return {
        ...assignment,
        submissions: userSubmissions
      }
    })

    return NextResponse.json({ assignments: assignmentsWithUserSubmissions })
  } catch (error: any) {
    console.error('[GET /api/assignments] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
