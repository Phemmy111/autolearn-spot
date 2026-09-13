import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * PUT /api/author/products/[id]/lessons/[lessonId]/quizzes/[quizId]
 * Update a quiz
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; lessonId: string; quizId: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { lessonId, quizId } = await params
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
      .select('author_id')
      .eq('id', lesson.product_id)
      .single()

    if (!product || product.author_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { data: quiz } = await supabaseAdmin
      .from('quizzes')
      .update({
        title: body.title,
        description: body.description,
        time_limit: body.time_limit,
        passing_score: body.passing_score,
        is_active: body.is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', quizId)
      .eq('lesson_id', lessonId)
      .select()
      .single()

    if (!quiz) {
      return NextResponse.json({ error: 'Failed to update quiz' }, { status: 500 })
    }

    return NextResponse.json({ success: true, quiz })
  } catch (error: any) {
    console.error('[PUT /api/author/products/[id]/lessons/[lessonId]/quizzes/[quizId]] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/author/products/[id]/lessons/[lessonId]/quizzes/[quizId]
 * Delete a quiz
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; lessonId: string; quizId: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { lessonId, quizId } = await params

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
      .select('author_id')
      .eq('id', lesson.product_id)
      .single()

    if (!product || product.author_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { error } = await supabaseAdmin
      .from('quizzes')
      .delete()
      .eq('id', quizId)
      .eq('lesson_id', lessonId)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete quiz' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[DELETE /api/author/products/[id]/lessons/[lessonId]/quizzes/[quizId]] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
