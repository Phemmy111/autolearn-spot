'use client'

import { Leaderboard } from '@/components/leaderboard'

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-[#0a0c10] p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Leaderboard</h1>
        <p className="text-[#b9cacb]">Top performers across all cohorts</p>
      </div>
      <Leaderboard />
    </div>
  )
}
