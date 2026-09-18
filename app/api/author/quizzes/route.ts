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

    // Get internal author_id from clerk userId
    const { data: author } = await supabaseAdmin
      .from('authors')
      .select('id')
      .eq('clerk_user_id', userId)
      .maybeSingle()

    if (!author) {
      return NextResponse.json({ error: 'Author profile not found' }, { status: 403 })
    }

    // Get all quizzes for the author's lessons using internal author_id
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
      .eq('lesson.product.author_id', author.id)
      .order('created_at', { ascending: false })

    console.log('[GET /api/author/quizzes] Clerk userId:', userId)
    console.log('[GET /api/author/quizzes] Internal author_id:', author.id)
    console.log('[GET /api/author/quizzes] Quizzes found:', quizzes?.length || 0)
    console.log('[GET /api/author/quizzes] Quiz data:', quizzes)
    
    // If no quizzes found, try a simpler query to check if quizzes exist at all
    if (!quizzes || quizzes.length === 0) {
      console.log('[GET /api/author/quizzes] No quizzes found, checking all quizzes in database...')
      const { data: allQuizzes } = await supabaseAdmin
        .from('quizzes')
        .select('id, title, lesson_id, created_at')
        .order('created_at', { ascending: false })
        .limit(5)
      console.log('[GET /api/author/quizzes] All quizzes in database:', allQuizzes)
    }

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
