import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin'

// GET - Public endpoint for students to view active quizzes
export async function GET() {
  try {
    const { data: quizzes, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('is_active', true)
      .order('week_number', { ascending: true })

    if (error) {
      console.error('Error fetching quizzes:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ quizzes })
  } catch (error: any) {
    console.error('Unexpected error fetching quizzes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Admin only: Create new quiz
export async function POST(request: Request) {
  try {
    // Server-side admin check
    await requireAdmin()

    const body = await request.json()
    const { title, description, week_number, phase, time_limit, passing_score } = body

    // Validate required fields
    if (!title || !week_number || !phase) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

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

    if (error) {
      console.error('Error creating quiz:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ quiz }, { status: 201 })
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      console.error('Unauthorized quiz creation attempt')
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
    }
    console.error('Unexpected error creating quiz:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
