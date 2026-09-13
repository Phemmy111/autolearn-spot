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

    // Resolve user names from enrollments table
    const userIds = [...new Set(submissions?.map((s: any) => s.user_id).filter(Boolean))]
    let userMap: Record<string, { name: string; email: string }> = {}

    if (userIds.length > 0) {
      const { data: enrollments } = await supabaseAdmin
        .from('enrollments')
        .select('clerk_user_id, email, full_name, first_name, last_name')
        .in('clerk_user_id', userIds)

      if (enrollments) {
        for (const e of enrollments) {
          if (e.clerk_user_id && !userMap[e.clerk_user_id]) {
            userMap[e.clerk_user_id] = {
              name: e.full_name || [e.first_name, e.last_name].filter(Boolean).join(' ') || 'Unknown',
              email: e.email || ''
            }
          }
        }
      }
    }

    const mappedSubmissions = submissions?.map((s: any) => ({
      ...s,
      user: {
        id: s.user_id,
        name: userMap[s.user_id]?.name || 'Unknown Student',
        email: userMap[s.user_id]?.email || ''
      }
    }))

    return NextResponse.json({ success: true, submissions: mappedSubmissions })
  } catch (error: any) {
    console.error('[GET /api/author/assignments/[id]/submissions] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
