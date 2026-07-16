'use client'

import { useEffect, useState } from 'react'
import { LeaderboardEntry } from '@/types/quiz'
import { fetchLeaderboard } from '@/lib/api/quiz'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Trophy, Medal, AlertCircle } from 'lucide-react'

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchLeaderboard()
        setEntries(data)
      } catch (err) {
        setError('Failed to load leaderboard.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="py-20">
        <LoadingSpinner message="Loading leaderboard..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-20 flex justify-center">
        <div className="flex max-w-md flex-col items-center justify-center gap-4 rounded-xl border border-[#1f2229] bg-[#0c0e12] p-8 text-center shadow-xl">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <h2 className="font-heading text-xl font-bold text-white">Oops</h2>
          <p className="font-mono text-sm text-[#b9cacb]">{error}</p>
        </div>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="flex flex-col items-center justify-center text-center p-12 border border-[#1f2229] bg-[#0c0e12] rounded-xl shadow-xl">
          <Trophy className="h-16 w-16 text-[#3b494b] mb-4" />
          <h2 className="font-heading text-2xl font-bold text-white mb-2">No Rankings Yet</h2>
          <p className="font-mono text-sm text-[#b9cacb]">Complete quizzes to get on the leaderboard!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="mb-10 text-center">
        <Trophy className="mx-auto h-16 w-16 text-[#00f0ff] drop-shadow-[0_0_15px_rgba(0,240,255,0.5)] mb-4" />
        <h1 className="font-heading text-4xl font-bold uppercase text-white mb-2">Weekly Leaderboard</h1>
        <p className="font-mono text-sm text-[#b9cacb]">Top performers for this week's assessments.</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#1f2229] bg-[#0c0e12] shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-mono text-[#b9cacb]">
            <thead className="bg-[#111317] text-xs uppercase text-[#5d5f63]">
              <tr>
                <th scope="col" className="px-6 py-4">Rank</th>
                <th scope="col" className="px-6 py-4">Student</th>
                <th scope="col" className="px-6 py-4">Score</th>
                <th scope="col" className="px-6 py-4">Percentage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2229]">
              {entries.map((entry, idx) => {
                const isTop3 = entry.rank <= 3
                return (
                  <tr key={entry.studentId} className={`hover:bg-[#1a1d24] transition-colors ${idx % 2 === 0 ? 'bg-[#0c0e12]' : 'bg-[#111317]'}`}>
                    <td className="px-6 py-4 font-bold whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {entry.rank === 1 && <Medal className="h-5 w-5 text-yellow-400" />}
                        {entry.rank === 2 && <Medal className="h-5 w-5 text-gray-300" />}
                        {entry.rank === 3 && <Medal className="h-5 w-5 text-amber-600" />}
                        <span className={isTop3 ? 'text-white' : 'text-[#5d5f63]'}>#{entry.rank}</span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap ${isTop3 ? 'text-white font-bold' : ''}`}>
                      {entry.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[#00f0ff] font-bold">
                      {entry.score}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-[#1f2229] rounded-full h-1.5 overflow-hidden">
                          <div className="bg-[#00f0ff] h-1.5 rounded-full" style={{ width: `${entry.percentage}%` }}></div>
                        </div>
                        <span className="text-xs">{entry.percentage}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
