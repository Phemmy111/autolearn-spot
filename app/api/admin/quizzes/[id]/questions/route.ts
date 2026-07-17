import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin'

// GET - Admin only: Get all questions for a quiz
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()

    const { data: questions, error } = await supabase
      .from('questions')
      .select('*')
      .eq('quiz_id', params.id)
      .order('order_index', { ascending: true })

    if (error) {
      console.error('Error fetching questions for quiz:', params.id, error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ questions })
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      console.error('Unauthorized attempt to fetch questions for quiz:', params.id)
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
    }
    console.error('Unexpected error fetching questions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Admin only: Create new question
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { question_text, question_type, options, correct_answer, explanation, points } = body

    // Validate required fields
    if (!question_text || !question_type || !correct_answer) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get current max order_index
    const { data: existingQuestions } = await supabase
      .from('questions')
      .select('order_index')
      .eq('quiz_id', params.id)
      .order('order_index', { ascending: false })
      .limit(1)

    const nextOrderIndex = existingQuestions?.[0]?.order_index + 1 || 0

    const { data: question, error } = await supabase
      .from('questions')
      .insert({
        quiz_id: params.id,
        question_text,
        question_type,
        options: options ? JSON.stringify(options) : null,
        correct_answer,
        explanation,
        points: points || 1,
        order_index: nextOrderIndex,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating question for quiz:', params.id, error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ question }, { status: 201 })
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      console.error('Unauthorized attempt to create question for quiz:', params.id)
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
    }
    console.error('Unexpected error creating question:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
