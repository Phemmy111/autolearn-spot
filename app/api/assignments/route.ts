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

    // Only fetch assignments that the user has submitted
    const { data: userSubmissions, error: submissionsError } = await supabase
      .from('submissions')
      .select(`
        assignment_id,
        id,
        user_id,
        live_url,
        screenshot_url,
        notes,
        status,
        ai_score,
        ai_feedback,
        created_at,
        updated_at,
        assignment:assignments(
          id,
          title,
          description,
          lesson_id,
          lesson_uuid_id,
          cohort_id,
          due_date,
          order_index
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    console.log('[GET /api/assignments] User submissions result:', { 
      submissionCount: userSubmissions?.length || 0, 
      error: submissionsError?.message 
    });

    if (submissionsError) {
      console.error('Error fetching user submissions:', submissionsError)
      return NextResponse.json({ error: submissionsError.message }, { status: 500 })
    }

    if (!userSubmissions || userSubmissions.length === 0) {
      return NextResponse.json({ assignments: [] })
    }

    // Group submissions by assignment and include assignment details
    const assignmentMap = new Map();
    
    userSubmissions.forEach((submission: any) => {
      const assignment = submission.assignment;
      if (!assignment) return;

      if (!assignmentMap.has(assignment.id)) {
        assignmentMap.set(assignment.id, {
          ...assignment,
          submissions: []
        });
      }

      assignmentMap.get(assignment.id).submissions.push({
        id: submission.id,
        user_id: submission.user_id,
        live_url: submission.live_url,
        screenshot_url: submission.screenshot_url,
        notes: submission.notes,
        status: submission.status,
        ai_score: submission.ai_score,
        ai_feedback: submission.ai_feedback,
        created_at: submission.created_at,
        updated_at: submission.updated_at,
      });
    });

    const assignments = Array.from(assignmentMap.values());
    console.log('[GET /api/assignments] Processed assignments:', assignments.length);

    return NextResponse.json({ assignments })
  } catch (error: any) {
    console.error('[GET /api/assignments] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
