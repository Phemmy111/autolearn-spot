'use client'

import { CheckCircle, Circle, Check } from 'lucide-react'
import { useProgress } from '@/hooks/useProgress'

export async function markVideoComplete(userId: string, videoId: string, courseSlug: string = 'ai-automation-bootcamp') {
  if (typeof window === 'undefined') return

  try {
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

    const res = await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId: videoId, watchPct: 100, completed: true }),
    })
    
    if (res.ok) {
      window.dispatchEvent(new Event('autolearn-progress-updated'))
      window.dispatchEvent(new Event('progress-updated'))
    } else {
      const storageKey = `autolearn-progress-${userId}`
      const raw = localStorage.getItem(storageKey)
      const current = raw ? JSON.parse(raw) : []
      if (!current.includes(videoId)) {
        localStorage.setItem(storageKey, JSON.stringify([...current, videoId]))
        window.dispatchEvent(new Event('autolearn-progress-updated'))
        window.dispatchEvent(new Event('progress-updated'))
      }
    }
  } catch (error) {
    console.error('Failed to mark video complete', error)
  }
}

export function ProgressBar({ totalVideos }: { totalVideos: number }) {
  const { progressData, isLoading } = useProgress()

  const count = progressData.filter(p => p.completed).length
  const pct = totalVideos > 0 ? Math.round((count / totalVideos) * 100) : 0

  if (isLoading) {
    return (
      <div className="mb-10 bg-[var(--card)] border border-brand-border/60 rounded-[20px] p-6 shadow-sm animate-pulse">
        <div className="h-4 w-32 bg-[var(--card)] brightness-95 rounded mb-4"></div>
        <div className="h-3 w-full bg-[var(--card)] brightness-95 rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="mb-10 bg-[var(--card)] border border-brand-border/60 rounded-[20px] p-6 sm:p-8 shadow-sm">
      <div className="flex items-end justify-between mb-4">
        <div>
          <h3 className="font-heading font-bold text-lg text-brand-text">Your Progress</h3>
          <p className="text-sm text-brand-text/60 mt-1">{count} of {totalVideos} lessons completed</p>
        </div>
        <span className="font-heading font-bold text-2xl text-[#10b981]">
          {pct}%
        </span>
      </div>
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-[var(--card)] brightness-95 border border-brand-border/50 shadow-inner">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#10b981] to-[#34d399] transition-all duration-1000 ease-out"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute inset-y-0 left-0 bg-[var(--card)]/20 transition-all duration-1000 ease-out shimmer-overlay"
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
      className={`flex items-center justify-center w-10 h-10 rounded-xl border transition-all ${
        isDone 
          ? 'bg-emerald-50 border-emerald-200 text-[#10b981]' 
          : 'bg-brand-bg border-brand-border text-neutral-400 hover:text-brand-text/70 hover:bg-[var(--card)] brightness-95'
      }`}
      title={isDone ? 'Completed' : 'Mark complete'}
    >
      {isDone ? (
        <CheckCircle className="h-5 w-5" />
      ) : (
        <Circle className="h-5 w-5" />
      )}
    </div>
  )
}

export function CompletedBadge({ videoId }: { videoId: string }) {
  const { completedIds } = useProgress()
  const isDone = completedIds.includes(videoId)

  if (!isDone) return null

  return (
    <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-lg bg-[#10b981] shadow-lg shadow-[#10b981]/20 px-2.5 py-1.5 text-xs font-bold text-white z-20">
      <Check className="h-3.5 w-3.5 stroke-[3]" />
      DONE
    </div>
  )
}
