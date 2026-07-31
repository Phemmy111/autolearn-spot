import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { data: leaderboard, error } = await supabaseAdmin
      .from('leaderboard')
      .select('*')
      .order('total_score', { ascending: false })
      .limit(50)

    if (error) {
      console.error('[GET /api/leaderboard] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('[GET /api/leaderboard] Raw leaderboard data:', leaderboard)

    // Map to expected frontend LeaderboardEntry format with new scoring system
    const formattedLeaderboard = leaderboard.map((entry: any, index: number) => ({
      id: entry.id,
      rank: index + 1,
      studentId: entry.user_id,
      user_id: entry.user_id, // For badge fetching
      name: entry.user_name || 'Anonymous Student',
      score: entry.total_score || 0,
      percentage: entry.total_score ? Math.round(entry.total_score) : 0,
      // Include new scoring breakdown
      assignment_score: entry.assignment_score || 0,
      quiz_score: entry.quiz_score || 0,
      video_completion: entry.video_completion || 0,
      certificate_bonus: entry.certificate_bonus || 0
    }))

    console.log('[GET /api/leaderboard] Formatted leaderboard:', formattedLeaderboard)

    return NextResponse.json({ leaderboard: formattedLeaderboard })
  } catch (error) {
    console.error('[GET /api/leaderboard] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
