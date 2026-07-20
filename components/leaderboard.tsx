'use client'

import { useEffect, useState } from 'react'
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react'
import { fetchLeaderboard } from '@/lib/api/quiz'
import { SupabaseLeaderboard } from '@/types/quiz'

export function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<SupabaseLeaderboard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadLeaderboard() {
      const data = await fetchLeaderboard()
      setLeaderboard(data as any[]) // Use any since the API returns LeaderboardEntry but component had SupabaseLeaderboard
      setLoading(false)
    }
    loadLeaderboard()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00f0ff]" />
      </div>
    )
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-400" />
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-300" />
    if (rank === 3) return <Award className="h-6 w-6 text-amber-600" />
    return <span className="font-mono text-sm font-bold text-[#b9cacb]">#{rank}</span>
  }

  const getRankClass = (rank: number) => {
    if (rank === 1) return 'border-yellow-400/30 bg-yellow-400/5'
    if (rank === 2) return 'border-gray-300/30 bg-gray-300/5'
    if (rank === 3) return 'border-amber-600/30 bg-amber-600/5'
    return 'border-[#1f2229] bg-[#0c0e12]'
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="h-6 w-6 text-[#00f0ff]" />
        <h2 className="font-heading text-2xl font-bold text-white">Leaderboard</h2>
      </div>

      {leaderboard.length === 0 ? (
        <div className="text-center py-12 border border-[#1f2229] bg-[#0c0e12] rounded-xl">
          <p className="font-mono text-sm text-[#b9cacb]">No quiz results yet. Be the first to complete a quiz!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((entry, index) => (
            <div
              key={entry.id}
              className={`group flex items-center justify-between p-4 rounded-lg border transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_4px_20px_rgba(0,240,255,0.08)] hover:border-[#00f0ff]/50 hover:bg-[#111317] ${getRankClass(index + 1)}`}
              aria-label={`Rank ${index + 1}: ${entry.name} with ${entry.score} points and ${entry.percentage}% average`}
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-10 h-10">
                  {getRankIcon(index + 1)}
                </div>
                <div>
                  <p className="font-heading font-semibold text-white">{entry.name}</p>
                  <p className="font-mono text-xs text-[#5d5f63]">
                    Top Performer
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-lg font-bold text-[#00f0ff]">{entry.score} pts</p>
                <p className="font-mono text-xs text-[#b9cacb]">{entry.percentage}% avg</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
