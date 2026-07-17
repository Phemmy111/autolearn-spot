import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin'

// GET - Public endpoint for students to view quiz details
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', params.id)
      .single()

    if (quizError) {
      return NextResponse.json({ error: quizError.message }, { status: 404 })
    }

    // Only return questions if quiz is active
    if (!quiz.is_active) {
      return NextResponse.json({ error: 'Quiz not available' }, { status: 403 })
    }

    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('quiz_id', params.id)
      .order('order_index', { ascending: true })

    if (questionsError) {
      return NextResponse.json({ error: questionsError.message }, { status: 500 })
    }

    return NextResponse.json({ quiz, questions })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Admin only: Update quiz
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { title, description, week_number, phase, time_limit, passing_score, is_active } = body

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
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ quiz })
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Admin only: Delete quiz
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()

    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', params.id)

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
