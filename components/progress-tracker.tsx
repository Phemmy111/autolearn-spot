'use client'

import { CheckCircle, Circle } from 'lucide-react'
import { useProgress } from '@/hooks/useProgress'

// Standalone function for legacy support, but prefers useProgress.markComplete
export async function markVideoComplete(userId: string, videoId: string, courseSlug: string = 'ai-automation-bootcamp') {
  if (typeof window === 'undefined') return

  try {
    // 1. Call certificate API
    fetch('/api/certificate/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseSlug, lessonId: videoId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          window.dispatchEvent(new Event('certificate-unlocked'))
        }
      })
      .catch((err) => console.error('[cert/complete] Network error:', err))

    // 2. Call progress API
    const res = await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId: videoId, watchPct: 100, completed: true }),
    })
    
    if (res.ok) {
      window.dispatchEvent(new Event('autolearn-progress-updated'))
      window.dispatchEvent(new Event('progress-updated'))
    } else {
      // Fallback local storage write if API fails
      const storageKey = `autolearn-progress-${userId}`
      const raw = localStorage.getItem(storageKey)
      const current = raw ? JSON.parse(raw) : []
      if (!current.includes(videoId)) {
        localStorage.setItem(storageKey, JSON.stringify([...current, videoId]))
      }
    }
  } catch (error) {
    console.error('Failed to mark video complete', error)
  }
}

// ── Progress Bar ──────────────────────────────────────────────
export function ProgressBar({ totalVideos }: { totalVideos: number }) {
  const { progressData, isLoading } = useProgress()

  const count = progressData.filter(p => p.completed).length
  const pct = totalVideos > 0 ? Math.round((count / totalVideos) * 100) : 0

  if (isLoading) {
    return (
      <div className="mb-10 border border-[#1f2229] bg-[#0c0e12] p-5 animate-pulse">
        <div className="h-4 w-1/3 bg-[#1f2229] mb-3"></div>
        <div className="h-2 w-full bg-[#1f2229]"></div>
      </div>
    )
  }

  return (
    <div className="mb-10 border border-[#1f2229] bg-[#0c0e12] p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-xs font-semibold uppercase tracking-[0.1em] text-[#b9cacb]">
          Your Progress
        </span>
        <span className="font-mono text-xs font-bold text-[#00f0ff]">
          {count} of {totalVideos} completed ({pct}%)
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden bg-[#1f2229]">
        <div
          className="absolute inset-y-0 left-0 bg-[#00f0ff] transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
        {/* Glow effect */}
        <div
          className="absolute inset-y-0 left-0 bg-[#00f0ff] blur-sm opacity-50 transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function MarkCompleteButton({ videoId }: { videoId: string }) {
  const { completedIds } = useProgress()
  const isDone = completedIds.includes(videoId)

  return (
    <div
      className={`flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] ${
        isDone ? 'text-emerald-400' : 'text-[#5d5f63]'
      }`}
    >
      {isDone ? (
        <CheckCircle className="h-4 w-4" />
      ) : (
        <Circle className="h-4 w-4" />
      )}
      {isDone ? 'Completed' : 'In Progress'}
    </div>
  )
}

// ── Completed Badge (overlay on video card thumbnail) ─────────
export function CompletedBadge({ videoId }: { videoId: string }) {
  const { completedIds } = useProgress()
  const isDone = completedIds.includes(videoId)

  if (!isDone) return null

  return (
    <div className="absolute top-2 left-2 flex items-center gap-1 rounded bg-emerald-500/90 px-2 py-1 font-mono text-[10px] font-bold uppercase text-white backdrop-blur">
      <CheckCircle className="h-3 w-3" />
      Done
    </div>
  )
}
