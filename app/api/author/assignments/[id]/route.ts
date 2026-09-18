import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET /api/author/assignments/[id]
 * Get a specific assignment by ID
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

    // Get the assignment with ownership check
    const { data: assignment, error } = await supabaseAdmin
      .from('assignments')
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
        )
      `)
      .eq('id', id)
      .eq('lesson.product.author_id', author.id)
      .single()

    if (error || !assignment) {
      return NextResponse.json({ error: 'Assignment not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json({ success: true, assignment })
  } catch (error: any) {
    console.error('[GET /api/author/assignments/[id]] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/author/assignments/[id]
 * Delete an assignment
 */
export async function DELETE(
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

    // Verify ownership before deleting
    const { data: assignment } = await supabaseAdmin
      .from('assignments')
      .select(`
        lesson:lessons!inner (
          product:learning_products!inner (
            author_id
          )
        )
      `)
      .eq('id', id)
      .single()

    if (!assignment || assignment.lesson?.product?.author_id !== author.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete the assignment
    const { error } = await supabaseAdmin
      .from('assignments')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[DELETE /api/author/assignments/[id]] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[DELETE /api/author/assignments/[id]] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
