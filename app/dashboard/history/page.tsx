'use client'

import { useEffect, useState } from 'react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { History, CheckCircle2, XCircle, AlertCircle, FileText, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface QuizHistoryEntry {
  id: string
  week: number
  title: string
  phase: string
  score: number
  percentage: number
  status: 'passed' | 'failed'
  submittedAt: string
  type: 'quiz'
}

interface AssignmentHistoryEntry {
  id: string
  week_number: number
  title: string
  status: 'submitted' | 'approved' | 'needs_revision'
  ai_score: number | null
  max_score: number
  created_at: string
  updated_at: string
  type: 'assignment'
  live_url: string | null
  screenshot_url: string | null
  notes: string | null
  ai_feedback: string | null
}

type HistoryEntry = QuizHistoryEntry | AssignmentHistoryEntry

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadHistory() {
      try {
        // Load quiz history
        const quizRes = await fetch('/api/quizzes/history')
        const quizData = quizRes.ok ? await quizRes.json() : { history: [] }
        const quizEntries: QuizHistoryEntry[] = (quizData.history || []).map((h: any) => ({
          ...h,
          type: 'quiz' as const
        }))

        // Load assignment history
        const assignmentRes = await fetch('/api/assignments')
        const assignmentData = assignmentRes.ok ? await assignmentRes.json() : { assignments: [] }
        const assignmentEntries: AssignmentHistoryEntry[] = (assignmentData.assignments || [])
          .filter((a: any) => a.submissions && a.submissions.length > 0)
          .map((a: any) => ({
            id: a.submissions[0].id,
            week_number: a.week_number,
            title: a.title,
            status: a.submissions[0].status,
            ai_score: a.submissions[0].ai_score,
            max_score: a.max_score,
            created_at: a.submissions[0].created_at,
            updated_at: a.submissions[0].updated_at,
            type: 'assignment' as const,
            live_url: a.submissions[0].live_url,
            screenshot_url: a.submissions[0].screenshot_url,
            notes: a.submissions[0].notes,
            ai_feedback: a.submissions[0].ai_feedback
          }))

        // Combine and sort by date
        const combined = [...quizEntries, ...assignmentEntries].sort((a, b) => {
          const dateA = new Date(a.type === 'quiz' ? a.submittedAt : a.created_at).getTime()
          const dateB = new Date(b.type === 'quiz' ? b.submittedAt : b.created_at).getTime()
          return dateB - dateA
        })

        setHistory(combined)
      } catch (err) {
        setError('Failed to load history.')
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
          <h2 className="font-heading text-2xl font-bold text-white mb-2">No History Yet</h2>
          <p className="font-mono text-sm text-[#b9cacb]">You haven't completed any quizzes or assignments yet.</p>
        </div>
      </div>
    )
  }

  const getEntryIcon = (entry: HistoryEntry) => {
    return entry.type === 'quiz' ? <CheckCircle2 className="h-4 w-4" /> : <FileText className="h-4 w-4" />
  }

  const getEntryStatus = (entry: HistoryEntry) => {
    if (entry.type === 'quiz') {
      return entry.status === 'passed' ? (
        <span className="text-emerald-400 uppercase text-xs font-bold">Passed</span>
      ) : (
        <span className="text-red-400 uppercase text-xs font-bold">Failed</span>
      )
    } else {
      switch (entry.status) {
        case 'submitted':
          return <span className="text-[#b9cacb] uppercase text-xs font-bold">Submitted</span>
        case 'approved':
          return <span className="text-emerald-400 uppercase text-xs font-bold">Approved</span>
        case 'needs_revision':
          return <span className="text-red-400 uppercase text-xs font-bold">Needs Revision</span>
        default:
          return null
      }
    }
  }

  const getEntryScore = (entry: HistoryEntry) => {
    if (entry.type === 'quiz') {
      return (
        <div className="flex flex-col">
          <span className="font-bold text-[#00f0ff]">{entry.score} pts</span>
          <span className="text-xs text-[#5d5f63]">{entry.percentage}%</span>
        </div>
      )
    } else {
      return entry.ai_score !== null ? (
        <div className="flex flex-col">
          <span className="font-bold text-[#00f0ff]">{entry.ai_score} pts</span>
          <span className="text-xs text-[#5d5f63]">/ {entry.max_score}</span>
        </div>
      ) : (
        <span className="text-[#5d5f63]">Pending</span>
      )
    }
  }

  const getEntryDate = (entry: HistoryEntry) => {
    const date = entry.type === 'quiz' ? entry.submittedAt : entry.created_at
    return new Date(date).toLocaleDateString()
  }

  const getEntryWeek = (entry: HistoryEntry) => {
    return entry.type === 'quiz' ? `Week ${entry.week} • ${entry.phase}` : `Week ${entry.week_number}`
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="mb-10 text-center">
        <History className="mx-auto h-16 w-16 text-[#00f0ff] drop-shadow-[0_0_15px_rgba(0,240,255,0.5)] mb-4" />
        <h1 className="font-heading text-4xl font-bold uppercase text-white mb-2">History</h1>
        <p className="font-mono text-sm text-[#b9cacb]">Review your past quiz and assignment submissions.</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#1f2229] bg-[#0c0e12] shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-mono text-[#b9cacb]">
            <thead className="bg-[#111317] text-xs uppercase text-[#5d5f63]">
              <tr>
                <th scope="col" className="px-6 py-4">Type</th>
                <th scope="col" className="px-6 py-4">Title</th>
                <th scope="col" className="px-6 py-4">Date</th>
                <th scope="col" className="px-6 py-4">Score</th>
                <th scope="col" className="px-6 py-4">Status</th>
                <th scope="col" className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2229]">
              {history.map((entry, idx) => (
                <tr key={entry.id} className={`hover:bg-[#1a1d24] transition-colors ${idx % 2 === 0 ? 'bg-[#0c0e12]' : 'bg-[#111317]'}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getEntryIcon(entry)}
                      <span className="uppercase text-xs font-bold text-white">{entry.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-bold text-white">{entry.title}</span>
                      <span className="text-xs text-[#5d5f63]">{getEntryWeek(entry)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs">
                    {getEntryDate(entry)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getEntryScore(entry)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getEntryStatus(entry)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {entry.type === 'assignment' && (entry as AssignmentHistoryEntry).live_url ? (
                      <a
                        href={(entry as AssignmentHistoryEntry).live_url!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[#00f0ff] hover:text-white transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span className="text-xs">View</span>
                      </a>
                    ) : (
                      <span className="text-[#5d5f63] text-xs">-</span>
                    )}
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
