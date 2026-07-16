'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { QuizHistoryEntry } from '@/types/quiz'
import { fetchQuizHistory } from '@/lib/api/quiz'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { History, AlertCircle, CheckCircle, XCircle } from 'lucide-react'

export default function HistoryPage() {
  const { isLoaded, userId } = useAuth()
  const [entries, setEntries] = useState<QuizHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      if (!userId) return
      try {
        const data = await fetchQuizHistory(userId)
        setEntries(data)
      } catch (err) {
        setError('Failed to load quiz history.')
      } finally {
        setLoading(false)
      }
    }
    
    if (isLoaded) {
      if (userId) load()
      else setLoading(false)
    }
  }, [isLoaded, userId])

  if (!isLoaded || loading) {
    return (
      <div className="py-20">
        <LoadingSpinner message="Loading your history..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-20 flex justify-center">
        <div className="flex max-w-md flex-col items-center justify-center gap-4 rounded-xl border border-[#1f2229] bg-[#0c0e12] p-8 text-center shadow-xl">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <h2 className="font-heading text-xl font-bold text-white">Error</h2>
          <p className="font-mono text-sm text-[#b9cacb]">{error}</p>
        </div>
      </div>
    )
  }

  if (!userId) return null

  if (entries.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="flex flex-col items-center justify-center text-center p-12 border border-[#1f2229] bg-[#0c0e12] rounded-xl shadow-xl">
          <History className="h-16 w-16 text-[#3b494b] mb-4" />
          <h2 className="font-heading text-2xl font-bold text-white mb-2">No Quiz History</h2>
          <p className="font-mono text-sm text-[#b9cacb]">You haven't taken any quizzes yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="mb-10 flex items-center gap-4">
        <History className="h-10 w-10 text-[#00f0ff]" />
        <div>
          <h1 className="font-heading text-3xl font-bold uppercase text-white">Quiz History</h1>
          <p className="font-mono text-sm text-[#b9cacb]">Track your performance across weeks.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {entries.map((entry, idx) => {
          const isPassed = entry.status.toLowerCase() === 'passed'
          
          return (
            <div key={idx} className="flex flex-col rounded-xl border border-[#1f2229] bg-[#0c0e12] p-6 shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl hover:border-[#3b494b]">
              <div className="flex justify-between items-start mb-4">
                <div className="font-heading text-xl font-bold text-white">Week {entry.week}</div>
                {isPassed ? (
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-400" />
                )}
              </div>
              
              <div className="flex-1 flex flex-col justify-center my-4">
                <div className="text-4xl font-bold text-center text-[#00f0ff]">{entry.score}</div>
                <div className="text-center font-mono text-xs text-[#5d5f63] mt-1">Score</div>
              </div>

              <div className="mt-auto space-y-3 pt-4 border-t border-[#1f2229]">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-mono text-[#5d5f63]">Percentage</span>
                  <span className="font-mono text-white font-bold">{entry.percentage}%</span>
                </div>
                <div className="w-full bg-[#1f2229] rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full ${isPassed ? 'bg-emerald-400' : 'bg-red-400'}`} 
                    style={{ width: `${entry.percentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className={isPassed ? 'text-emerald-400' : 'text-red-400'}>{entry.status}</span>
                  <span className="text-[#5d5f63]">{new Date(entry.submittedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
