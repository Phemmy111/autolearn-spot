import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * POST /api/author/products/[id]/lessons/[lessonId]/quizzes/[quizId]/questions
 * Create a question for a quiz
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; lessonId: string; quizId: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { lessonId, quizId } = await params
    const body = await request.json()

    // Verify lesson ownership
    const { data: lesson } = await supabaseAdmin
      .from('lessons')
      .select('product_id')
      .eq('uuid_id', lessonId)
      .single()

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    // Verify product ownership
    const { data: product } = await supabaseAdmin
      .from('learning_products')
      .select('author_id')
      .eq('id', lesson.product_id)
      .single()

    if (!product || product.author_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Verify quiz belongs to this lesson
    const { data: quiz } = await supabaseAdmin
      .from('quizzes')
      .select('id')
      .eq('id', quizId)
      .eq('lesson_id', lessonId)
      .single()

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found or not associated with this lesson' }, { status: 404 })
    }

    // Create question
    const { data: question, error } = await supabaseAdmin
      .from('questions')
      .insert({
        quiz_id: quizId,
        question_text: body.question_text,
        question_type: body.question_type || 'multiple_choice',
        options: body.options || [],
        correct_answer: body.correct_answer,
        explanation: body.explanation || '',
        points: body.points || 10,
        order_index: body.order_index || 0,
      })
      .select()
      .single()

    if (error) {
      console.error('[POST /api/author/products/[id]/lessons/[lessonId]/quizzes/[quizId]/questions] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, question })
  } catch (error: any) {
    console.error('[POST /api/author/products/[id]/lessons/[lessonId]/quizzes/[quizId]/questions] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
