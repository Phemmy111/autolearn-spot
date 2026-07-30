import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase'
import { auth, currentUser } from '@clerk/nextjs/server'
import { createNotification } from '@/lib/notifications'
import { invalidateAfterAssignmentSubmission } from '@/lib/analytics/integration'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// POST - Student only: Submit or update assignment
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    const user = await currentUser()
    
    if (!userId || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: assignmentId } = await params
    const body = await request.json()
    const { submission_url, notes, screenshot_url } = body

    // At least one of URL, screenshot, or notes must be provided
    if (!submission_url && !screenshot_url && !notes) {
      return NextResponse.json(
        { error: 'Please provide a URL, screenshot, or notes' },
        { status: 400 }
      )
    }

    // Check if assignment exists
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select('id, title, week_number')
      .eq('id', assignmentId)
      .single()

    if (assignmentError || !assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Check if user already has a submission
    const { data: existingSubmission } = await supabase
      .from('submissions')
      .select('*')
      .eq('assignment_id', assignmentId)
      .eq('user_id', userId)
      .single()

    let submission

    if (existingSubmission) {
      // Only allow editing if not yet reviewed
      if (existingSubmission.status !== 'submitted') {
        return NextResponse.json({ 
          error: 'Cannot edit submission after it has been reviewed' 
        }, { status: 400 })
      }

      // Update existing submission
      const { data: updated, error } = await supabase
        .from('submissions')
        .update({
          live_url: submission_url || existingSubmission.live_url,
          screenshot_url: screenshot_url || existingSubmission.screenshot_url,
          notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSubmission.id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      submission = updated
    } else {
      // Create new submission
      const { data: created, error } = await supabase
        .from('submissions')
        .insert({
          assignment_id: assignmentId,
          user_id: userId,
          screenshot_url: screenshot_url || null,
          live_url: submission_url || null,
          notes,
          status: 'submitted',
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      submission = created
    }

    // Create notification for assignment submission (only for new submissions)
    if (!existingSubmission) {
      try {
        await createNotification({
          title: 'Assignment Submitted',
          message: `Your submission for Week ${assignment.week_number} assignment "${assignment.title}" has been received.`,
          category: 'assignment',
          priority: 'normal',
          target_type: 'student',
          target_id: userId,
          action_url: '/dashboard/assignments',
          action_label: 'View Assignments',
          send_email: false,
          event_id: `assignment_submission_${submission.id}`,
        });
      } catch (notifError) {
        console.error('Failed to create notification:', notifError);
        // Don't fail the submission if notification fails
      }
    }

    // Invalidate analytics cache after assignment submission
    try {
      const cohortId = assignment.cohort_id || 'default'
      await invalidateAfterAssignmentSubmission(userId, cohortId)
    } catch (cacheError) {
      console.error('Failed to invalidate analytics cache:', cacheError)
      // Don't fail the submission if cache invalidation fails
    }

    return NextResponse.json({ submission })
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
