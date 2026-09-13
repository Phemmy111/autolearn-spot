import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET /api/author/quizzes/[id]
 * Get a specific quiz by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get the quiz with ownership check
    const { data: quiz, error } = await supabaseAdmin
      .from('quizzes')
      .select(`
        *,
        lesson:lessons!inner (
          uuid_id,
          title,
          product:learning_products!inner (
            id,
            title,
            author_id
          )
        ),
        questions(*)
      `)
      .eq('id', id)
      .eq('lesson.product.author_id', userId)
      .single()

    if (error || !quiz) {
      return NextResponse.json({ error: 'Quiz not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json({ success: true, quiz })
  } catch (error: any) {
    console.error('[GET /api/author/quizzes/[id]] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/author/quizzes/[id]
 * Delete a quiz
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership before deleting
    const { data: quiz } = await supabaseAdmin
      .from('quizzes')
      .select(`
        lesson:lessons!inner (
          product:learning_products!inner (
            author_id
          )
        )
      `)
      .eq('id', id)
      .single()

    if (!quiz || quiz.lesson?.product?.author_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete the quiz (questions will be deleted via CASCADE)
    const { error } = await supabaseAdmin
      .from('quizzes')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[DELETE /api/author/quizzes/[id]] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[DELETE /api/author/quizzes/[id]] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
