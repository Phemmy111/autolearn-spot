import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin'

// GET - Admin only: Get all quizzes
export async function GET() {
  try {
    await requireAdmin()

    const { data: quizzes, error } = await supabase
      .from('quizzes')
      .select('*, questions(count)')
      .order('week_number', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ quizzes })
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Admin only: Create new quiz
export async function POST(request: Request) {
  try {
    console.log('Starting quiz creation...')
    await requireAdmin()
    console.log('Admin check passed')

    const body = await request.json()
    console.log('Request body received:', { title: body.title, week_number: body.week_number, phase: body.phase })
    const { title, description, week_number, phase, time_limit, passing_score } = body

    // Validate required fields
    if (!title || !week_number || !phase) {
      console.log('Validation failed: missing required fields')
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    console.log('Inserting quiz into database...')
    const { data: quiz, error } = await supabase
      .from('quizzes')
      .insert({
        title,
        description,
        week_number,
        phase,
        time_limit,
        passing_score: passing_score || 70,
      })
      .select()
      .single()

    console.log('Quiz insert result:', { quiz, error })

    if (error) {
      console.error('Error creating quiz:', error)
      console.error('Error details:', { message: error.message, code: error.code, details: error.details })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('Quiz created successfully:', quiz)
    return NextResponse.json({ quiz }, { status: 201 })
  } catch (error: any) {
    console.error('Error in quiz creation:', error)
    console.error('Error stack:', error.stack)
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
