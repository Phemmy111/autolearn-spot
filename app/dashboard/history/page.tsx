'use client'

import { useEffect, useState } from 'react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { History, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

interface HistoryEntry {
  id: string
  week: number
  title: string
  phase: string
  score: number
  percentage: number
  status: 'passed' | 'failed'
  submittedAt: string
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch('/api/quizzes/history')
        if (!res.ok) throw new Error('Failed to fetch history')
        const data = await res.json()
        setHistory(data.history || [])
      } catch (err) {
        setError('Failed to load quiz history.')
      } finally {
        setLoading(false)
      }
    }
    loadHistory()
  }, [])

  if (loading) {
    return (
      <div className="py-20">
        <LoadingSpinner message="Loading history..." />
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

  if (history.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="flex flex-col items-center justify-center text-center p-12 border border-[#1f2229] bg-[#0c0e12] rounded-xl shadow-xl">
          <History className="h-16 w-16 text-[#3b494b] mb-4" />
          <h2 className="font-heading text-2xl font-bold text-white mb-2">No Quiz History</h2>
          <p className="font-mono text-sm text-[#b9cacb]">You haven't completed any quizzes yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="mb-10 text-center">
        <History className="mx-auto h-16 w-16 text-[#00f0ff] drop-shadow-[0_0_15px_rgba(0,240,255,0.5)] mb-4" />
        <h1 className="font-heading text-4xl font-bold uppercase text-white mb-2">Quiz History</h1>
        <p className="font-mono text-sm text-[#b9cacb]">Review your past quiz performances.</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#1f2229] bg-[#0c0e12] shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-mono text-[#b9cacb]">
            <thead className="bg-[#111317] text-xs uppercase text-[#5d5f63]">
              <tr>
                <th scope="col" className="px-6 py-4">Quiz</th>
                <th scope="col" className="px-6 py-4">Date</th>
                <th scope="col" className="px-6 py-4">Score</th>
                <th scope="col" className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2229]">
              {history.map((entry, idx) => (
                <tr key={entry.id} className={`hover:bg-[#1a1d24] transition-colors ${idx % 2 === 0 ? 'bg-[#0c0e12]' : 'bg-[#111317]'}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-bold text-white">{entry.title}</span>
                      <span className="text-xs text-[#5d5f63]">Week {entry.week} • {entry.phase}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs">
                    {new Date(entry.submittedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-bold text-[#00f0ff]">{entry.score} pts</span>
                      <span className="text-xs text-[#5d5f63]">{entry.percentage}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`flex items-center gap-2 ${entry.status === 'passed' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {entry.status === 'passed' ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      <span className="uppercase text-xs font-bold">{entry.status}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
