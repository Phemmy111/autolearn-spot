'use client'

import { Leaderboard } from '@/components/leaderboard'

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Leaderboard</h1>
        <p className="text-neutral-500">Top performers across all cohorts</p>
      </div>
      <Leaderboard />
    </div>
  )
}
