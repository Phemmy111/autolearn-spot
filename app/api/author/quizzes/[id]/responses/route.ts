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

    // Get internal author_id from clerk userId
    const { data: author } = await supabaseAdmin
      .from('authors')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()

    if (!author) {
      return NextResponse.json({ error: 'Author profile not found' }, { status: 403 })
    }

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

    if (!quiz || quiz.lesson?.product?.author_id !== author.id) {
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
        )
      `)
      .eq('quiz_id', id)
      .order('completed_at', { ascending: false })

    if (error) {
      console.error('[GET /api/author/quizzes/[id]/responses] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Map inline user_name and user_email to match the frontend expected 'user' object structure
    const mappedResponses = responses?.map((r: any) => {
      const nameParts = (r.user_name || '').split(' ');
      return {
        ...r,
        submitted_at: r.completed_at || r.created_at, // Map to what frontend expects
        user: {
          id: r.user_id,
          first_name: nameParts[0] || 'Unknown',
          last_name: nameParts.slice(1).join(' ') || '',
          email_addresses: [{ email_address: r.user_email || '' }]
        }
      }
    })

    return NextResponse.json({ success: true, responses: mappedResponses })
  } catch (error: any) {
    console.error('[GET /api/author/quizzes/[id]/responses] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
