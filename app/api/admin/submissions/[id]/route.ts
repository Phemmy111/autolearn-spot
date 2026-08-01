import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin'
import { auth } from '@clerk/nextjs/server'
import { triggerLeaderboardUpdate } from '@/lib/leaderboard-scoring'

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
      .select('*')
      .eq('id', id)
      .single()

    console.log('[GRADING PIPELINE] BEFORE GRADING - Full submission row:', JSON.stringify(existingSubmission, null, 2))
    console.log('[GRADING PIPELINE] Grading payload:', { score, feedback, status })

    if (!existingSubmission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Update submission with review
    const { userId } = await auth()
    
    const updatePayload = {
      ai_score: score,
      ai_feedback: feedback,
      status,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    
    console.log('[GRADING PIPELINE] UPDATE payload:', JSON.stringify(updatePayload, null, 2))
    
    const { data: submission, error } = await supabaseAdmin
      .from('submissions')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single()

    console.log('[GRADING PIPELINE] AFTER GRADING - Full submission row:', JSON.stringify(submission, null, 2))
    console.log('[GRADING PIPELINE] Score-related columns:', {
      ai_score: submission.ai_score,
      score: submission.score,
      grade: submission.grade,
      percentage: submission.percentage,
      points: submission.points,
      max_points: submission.max_points,
      rubric_score: submission.rubric_score
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Trigger leaderboard update after grading
    try {
      console.log('[GRADING PIPELINE] Triggering leaderboard update after grading:', { userId: existingSubmission.user_id })
      await triggerLeaderboardUpdate(existingSubmission.user_id, 'assignment')
      console.log('[GRADING PIPELINE] Leaderboard update completed')
    } catch (leaderboardError) {
      console.error('[GRADING PIPELINE] Failed to trigger leaderboard update:', leaderboardError)
      // Don't fail the grading if leaderboard update fails
    }

    // Get assignment info for notification
    const { data: assignment } = await supabaseAdmin
      .from('assignments')
      .select('title, week_number')
      .eq('id', existingSubmission.assignment_id)
      .single()

    // Send Notification to Student
    if (existingSubmission.user_id) {
      try {
        const { createNotification } = await import('@/lib/notifications');
        const assignmentTitle = assignment?.title || `Week ${assignment?.week_number}`;
        await createNotification({
          title: 'Assignment Graded',
          message: `Your assignment "${assignmentTitle}" has been reviewed. Score: ${score}`,
          category: 'assignment_review',
          priority: 'normal',
          target_type: 'student',
          target_id: existingSubmission.user_id,
          action_url: '/dashboard/assignments',
          action_label: 'View Feedback',
          send_email: true,
          event_id: `assignment_graded_${id}`,
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
