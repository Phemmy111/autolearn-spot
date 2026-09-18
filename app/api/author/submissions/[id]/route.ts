import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * PUT /api/author/submissions/[id]
 * Author can grade and provide feedback on their assignment submissions
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { score, feedback } = body

    // Get internal author_id from clerk userId
    const { data: author } = await supabaseAdmin
      .from('authors')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()

    if (!author) {
      return NextResponse.json({ error: 'Author profile not found' }, { status: 403 })
    }

    // Get submission and verify ownership
    const { data: submission } = await supabaseAdmin
      .from('submissions')
      .select(`
        *,
        assignment:assignments!inner (
          lesson:lessons!inner (
            product:learning_products!inner (
              author_id
            )
          )
        )
      `)
      .eq('id', id)
      .single()

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    if (submission.assignment?.lesson?.product?.author_id !== author.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update submission with review
    const updatePayload = {
      ai_score: score,
      ai_feedback: feedback,
      status: 'reviewed',
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    
    const { data: updatedSubmission, error } = await supabaseAdmin
      .from('submissions')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ submission: updatedSubmission })
  } catch (error: any) {
    console.error('[PUT /api/author/submissions/[id]] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
