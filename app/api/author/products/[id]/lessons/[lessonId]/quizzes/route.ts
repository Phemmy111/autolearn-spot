import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET /api/author/products/[id]/lessons/[lessonId]/quizzes
 * Get quizzes for a specific lesson
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { lessonId } = await params

    // Verify lesson ownership (lessonId is uuid_id)
    const { data: lesson } = await supabaseAdmin
      .from('lessons')
      .select('product_id')
      .eq('uuid_id', lessonId)
      .single()

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    // Verify product ownership
    const { data: product } = await supabaseAdmin
      .from('learning_products')
      .select('author_id, status')
      .eq('id', lesson.product_id)
      .single()

    if (!product || product.author_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get quizzes for this lesson
    const { data: quizzes } = await supabaseAdmin
      .from('quizzes')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('created_at', { ascending: false })

    return NextResponse.json({ success: true, quizzes })
  } catch (error: any) {
    console.error('[GET /api/author/products/[id]/lessons/[lessonId]/quizzes] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/author/products/[id]/lessons/[lessonId]/quizzes
 * Create a new quiz for a lesson
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { lessonId } = await params
    const body = await request.json()

    // Verify lesson ownership (lessonId is uuid_id)
    const { data: lesson } = await supabaseAdmin
      .from('lessons')
      .select('product_id')
      .eq('uuid_id', lessonId)
      .single()

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    // Verify product ownership
    const { data: product } = await supabaseAdmin
      .from('learning_products')
      .select('author_id, status')
      .eq('id', lesson.product_id)
      .single()

    if (!product || product.author_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Validate required fields
    if (!body.title) {
      return NextResponse.json({ error: 'Quiz title is required' }, { status: 400 })
    }

    console.log('[QUIZ CREATE] Inserting quiz with data:', {
      title: body.title,
      description: body.description,
      lesson_id: lessonId,
      lesson_id_type: typeof lessonId,
    });

    const { data: quiz, error: insertError } = await supabaseAdmin
      .from('quizzes')
      .insert({
        title: body.title,
        description: body.description || null,
        lesson_id: lessonId,
        time_limit: body.time_limit || null,
        passing_score: body.passing_score || 70,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('[QUIZ CREATE] Insert error:', insertError);
      return NextResponse.json({ error: insertError.message, details: insertError }, { status: 500 })
    }

    if (!quiz) {
      return NextResponse.json({ error: 'Failed to create quiz' }, { status: 500 })
    }

    return NextResponse.json({ success: true, quiz })
  } catch (error: any) {
    console.error('[POST /api/author/products/[id]/lessons/[lessonId]/quizzes] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
