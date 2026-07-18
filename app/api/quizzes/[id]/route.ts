import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// GET - Public endpoint for students to view quiz details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const preview = searchParams.get('preview') === 'true'

    console.log('Fetching quiz:', id, 'preview:', preview)

    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', id)
      .single()

    if (quizError) {
      console.error('Quiz fetch error:', quizError)
      return NextResponse.json({ error: quizError.message }, { status: 404 })
    }

    console.log('Quiz found:', quiz.id, 'is_active:', quiz.is_active)

    // Only return questions if quiz is active OR it's a preview request
    if (!quiz.is_active && !preview) {
      console.log('Quiz not active and not preview, returning 403')
      return NextResponse.json({ error: 'Quiz not available' }, { status: 403 })
    }

    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('quiz_id', id)
      .order('order_index', { ascending: true })

    if (questionsError) {
      console.error('Questions fetch error:', questionsError)
      return NextResponse.json({ error: questionsError.message }, { status: 500 })
    }

    console.log('Questions found:', questions.length)

    return NextResponse.json({ quiz, questions })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Admin only: Update quiz
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()

    const { id } = await params
    const body = await request.json()
    const { title, description, week_number, phase, time_limit, passing_score, is_active } = body

    console.log('Updating quiz:', id, 'with is_active:', is_active)

    const { data: quiz, error } = await supabase
      .from('quizzes')
      .update({
        title,
        description,
        week_number,
        phase,
        time_limit,
        passing_score,
        is_active,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Quiz update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('Quiz updated successfully:', quiz.id, 'is_active:', quiz.is_active)

    return NextResponse.json({ quiz })
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      console.error('Unauthorized quiz update attempt')
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
    }
    console.error('Unexpected error updating quiz:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Admin only: Delete quiz
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()

    const { id } = await params

    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
