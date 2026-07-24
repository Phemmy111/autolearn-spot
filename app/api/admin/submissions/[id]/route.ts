import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin'
import { auth } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// PUT - Admin only: Review and score submission
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params

    const body = await request.json()
    const { score, feedback, status } = body

    // Validate required fields
    if (score === undefined || !status) {
      return NextResponse.json({ error: 'score and status are required' }, { status: 400 })
    }

    // Get submission to get user_id for notification
    const { data: existingSubmission } = await supabaseAdmin
      .from('submissions')
      .select('user_id, assignment_id')
      .eq('id', id)
      .single()

    if (!existingSubmission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Update submission with review
    const { userId } = await auth()
    
    const { data: submission, error } = await supabaseAdmin
      .from('submissions')
      .update({
        ai_score: score,
        ai_feedback: feedback,
        status,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, assignment:assignments(title, week_number)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Send Notification to Student
    if (existingSubmission.user_id) {
      try {
        const { createNotification } = await import('@/lib/notifications');
        const assignmentTitle = submission.assignment?.title || `Week ${submission.assignment?.week_number}`;
        await createNotification({
          title: 'Assignment Graded',
          message: `Your assignment "${assignmentTitle}" has been reviewed. Score: ${score}`,
          category: 'assignment_review',
          priority: 'normal',
          target_type: 'student',
          target_id: existingSubmission.user_id,
          action_url: '/dashboard/assignments',
          action_label: 'View Feedback',
          send_email: true
        });
      } catch (notifErr) {
        console.error('Failed to send assignment review notification:', notifErr);
      }
    }

    return NextResponse.json({ submission })
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
