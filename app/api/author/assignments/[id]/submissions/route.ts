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

    // Get submissions with user and assignment data
    const { data: submissions, error } = await supabaseAdmin
      .from('assignment_submissions')
      .select(`
        *,
        assignment:assignments!inner (
          id,
          title,
          max_score
        ),
        user:users!inner (
          id,
          first_name,
          last_name,
          email_addresses
        )
      `)
      .eq('assignment_id', id)
      .order('submitted_at', { ascending: false })

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
