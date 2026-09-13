import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET /api/author/quizzes
 * Get all quizzes for the authenticated author
 */
export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all quizzes for the author's lessons
    const { data: quizzes, error } = await supabaseAdmin
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
        questions(count),
        responses:quiz_responses(count)
      `)
      .eq('lesson.product.author_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[GET /api/author/quizzes] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, quizzes })
  } catch (error: any) {
    console.error('[GET /api/author/quizzes] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
