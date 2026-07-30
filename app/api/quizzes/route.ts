import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin'
import { createNotification } from '@/lib/notifications'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// GET - Public endpoint for students to view active quizzes
export async function GET() {
  try {
    console.log('Fetching active quizzes list')
    const { data: quizzes, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('is_active', true)
      .order('week_number', { ascending: true })

    if (error) {
      console.error('Error fetching quizzes:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('Active quizzes found:', quizzes?.length || 0)
    console.log('Quizzes:', quizzes?.map(q => ({ id: q.id, title: q.title, is_active: q.is_active })))

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

    // Send notification to all active students about new quiz
    try {
      await createNotification({
        title: 'New Quiz Available',
        message: `Week ${week_number} quiz "${title}" is now available. Test your knowledge!`,
        category: 'quiz',
        priority: 'normal',
        target_type: 'all',
        action_url: '/quizzes',
        action_label: 'Take Quiz',
        send_email: true,
        event_id: `quiz_created_${quiz.id}`,
      });
    } catch (notifErr) {
      console.error('Failed to send quiz notification:', notifErr);
      // Don't fail the quiz creation if notification fails
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
