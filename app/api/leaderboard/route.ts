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
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Map to expected frontend LeaderboardEntry format
    const formattedLeaderboard = leaderboard.map((entry: any, index: number) => ({
      id: entry.id,
      rank: index + 1,
      studentId: entry.user_id,
      name: entry.user_name || 'Anonymous Student',
      score: entry.total_score || 0,
      percentage: entry.average_score ? Math.round(entry.average_score) : 0
    }))

    return NextResponse.json({ leaderboard: formattedLeaderboard })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
