import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// GET - Admin only: Get all submissions for an assignment
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params

    const { data: submissions, error } = await supabaseAdmin
      .from('submissions')
      .select(`
        *,
        assignment:assignments (
          id,
          title,
          week_number,
          max_score
        )
      `)
      .eq('assignment_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching submissions:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Enrich submissions with student name/email
    const userIds = [...new Set((submissions || []).map((s: any) => s.user_id))]

    // Look up emails from enrollments
    const { data: enrollments } = await supabaseAdmin
      .from('enrollments')
      .select('clerk_user_id, email')
      .in('clerk_user_id', userIds)

    // Look up names from leaderboard
    const { data: leaderboardEntries } = await supabaseAdmin
      .from('leaderboard')
      .select('user_id, user_name, user_email')
      .in('user_id', userIds)

    const emailMap = new Map<string, string>()
    const nameMap = new Map<string, string>()

    enrollments?.forEach((e: any) => {
      if (e.clerk_user_id && e.email) emailMap.set(e.clerk_user_id, e.email)
    })
    leaderboardEntries?.forEach((l: any) => {
      if (l.user_id && l.user_name) nameMap.set(l.user_id, l.user_name)
      if (l.user_id && l.user_email && !emailMap.has(l.user_id)) {
        emailMap.set(l.user_id, l.user_email)
      }
    })

    const enrichedSubmissions = (submissions || []).map((s: any) => ({
      ...s,
      student_name: nameMap.get(s.user_id) || null,
      student_email: emailMap.get(s.user_id) || null,
    }))

    return NextResponse.json({ submissions: enrichedSubmissions })
  } catch (error: any) {
    console.error('Error in GET /api/admin/assignments/[id]/submissions:', error)
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
