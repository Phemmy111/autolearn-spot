import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET /api/author/quizzes/[id]/responses
 * Get all responses for a specific quiz
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

    // Verify ownership
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

    // Get responses with user and quiz data
    const { data: responses, error } = await supabaseAdmin
      .from('quiz_responses')
      .select(`
        *,
        quiz:quizzes!inner (
          id,
          title,
          passing_score
        ),
        user:users!inner (
          id,
          first_name,
          last_name,
          email_addresses
        )
      `)
      .eq('quiz_id', id)
      .order('submitted_at', { ascending: false })

    if (error) {
      console.error('[GET /api/author/quizzes/[id]/responses] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, responses })
  } catch (error: any) {
    console.error('[GET /api/author/quizzes/[id]/responses] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
