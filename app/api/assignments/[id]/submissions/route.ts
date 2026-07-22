import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { auth, currentUser } from '@clerk/nextjs/server'

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
    const { submission_url, notes } = body

    // Validate required fields
    if (!submission_url) {
      return NextResponse.json({ error: 'submission_url is required' }, { status: 400 })
    }

    // Check if assignment exists
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select('id')
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
          live_url: submission_url,
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
          screenshot_url: null, // Not used in Phase 3
          live_url: submission_url,
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

    return NextResponse.json({ submission })
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
