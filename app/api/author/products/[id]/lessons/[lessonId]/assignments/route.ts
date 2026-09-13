import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET /api/author/products/[id]/lessons/[lessonId]/assignments
 * Get assignments for a specific lesson
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

    // Get assignments for this lesson
    const { data: assignments } = await supabaseAdmin
      .from('assignments')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('order_index', { ascending: true })

    return NextResponse.json({ success: true, assignments })
  } catch (error: any) {
    console.error('[GET /api/author/products/[id]/lessons/[lessonId]/assignments] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/author/products/[id]/lessons/[lessonId]/assignments
 * Create a new assignment for a lesson
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

    // Validate required fields
    if (!body.title) {
      return NextResponse.json({ error: 'Assignment title is required' }, { status: 400 })
    }

    // Get current max order_index for this lesson
    const { data: existingAssignments } = await supabaseAdmin
      .from('assignments')
      .select('order_index')
      .eq('lesson_id', lessonId)
      .order('order_index', { ascending: false })
      .limit(1)
    
    const nextOrderIndex = (existingAssignments?.[0]?.order_index ?? 0) + 1

    const { data: assignment } = await supabaseAdmin
      .from('assignments')
      .insert({
        lesson_id: lessonId,
        title: body.title,
        description: body.description || null,
        instructions: body.instructions || null,
        submission_type: body.submission_type || 'url',
        rubric: body.rubric || null,
        ai_review_prompt: body.ai_review_prompt || null,
        is_required: body.is_required ?? true,
        due_date: body.due_date || null,
        max_score: body.max_score || 100,
        order_index: nextOrderIndex,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (!assignment) {
      return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 })
    }

    return NextResponse.json({ success: true, assignment })
  } catch (error: any) {
    console.error('[POST /api/author/products/[id]/lessons/[lessonId]/assignments] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
