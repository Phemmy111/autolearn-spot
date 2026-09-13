import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET /api/author/assignments/[id]/submissions
 * Get all submissions for a specific assignment
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

    if (!assignment || assignment.lesson?.product?.author_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get submissions with assignment data (user_id is a Clerk user ID, not a foreign key)
    const { data: submissions, error } = await supabaseAdmin
      .from('submissions')
      .select(`
        *,
        assignment:assignments!inner (
          id,
          title,
          max_score
        )
      `)
      .eq('assignment_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[GET /api/author/assignments/[id]/submissions] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, submissions })
  } catch (error: any) {
    console.error('[GET /api/author/assignments/[id]/submissions] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
