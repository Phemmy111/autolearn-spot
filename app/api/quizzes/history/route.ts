import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: history, error } = await supabaseAdmin
      .from('quiz_responses')
      .select(`
        id,
        score,
        percentage,
        passed,
        completed_at,
        quizzes (
          title,
          week_number,
          phase
        )
      `)
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })

    if (error) {
      console.error('Error fetching quiz history:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform data for frontend
    const formattedHistory = history.map((entry: any) => ({
      id: entry.id,
      week: entry.quizzes?.week_number || 0,
      title: entry.quizzes?.title || 'Unknown Quiz',
      phase: entry.quizzes?.phase || '',
      score: entry.score,
      percentage: entry.percentage,
      status: entry.passed ? 'passed' : 'failed',
      submittedAt: entry.completed_at,
    }))

    return NextResponse.json({ history: formattedHistory })
  } catch (error: any) {
    console.error('Unexpected error fetching quiz history:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
