import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * PUT /api/author/products/[id]/lessons/[lessonId]/assignments/[assignmentId]
 * Update an assignment
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; lessonId: string; assignmentId: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { lessonId, assignmentId } = await params
    const body = await request.json()

    // Verify lesson ownership
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

    const { data: assignment } = await supabaseAdmin
      .from('assignments')
      .update({
        title: body.title,
        description: body.description,
        instructions: body.instructions,
        submission_type: body.submission_type,
        rubric: body.rubric,
        ai_review_prompt: body.ai_review_prompt,
        is_required: body.is_required,
        due_date: body.due_date,
        max_score: body.max_score,
        updated_at: new Date().toISOString()
      })
      .eq('id', assignmentId)
      .eq('lesson_id', lessonId)
      .select()
      .single()

    if (!assignment) {
      return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 })
    }

    return NextResponse.json({ success: true, assignment })
  } catch (error: any) {
    console.error('[PUT /api/author/products/[id]/lessons/[lessonId]/assignments/[assignmentId]] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/author/products/[id]/lessons/[lessonId]/assignments/[assignmentId]
 * Delete an assignment
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; lessonId: string; assignmentId: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { lessonId, assignmentId } = await params

    // Verify lesson ownership
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
      .from('assignments')
      .delete()
      .eq('id', assignmentId)
      .eq('lesson_id', lessonId)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[DELETE /api/author/products/[id]/lessons/[lessonId]/assignments/[assignmentId]] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
