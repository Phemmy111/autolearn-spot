'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import { CheckCircle, Circle } from 'lucide-react'

function getStorageKey(userId: string) {
  return `autolearn-progress-${userId}`
}

function getCompleted(userId: string): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(getStorageKey(userId))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function setCompleted(userId: string, completed: string[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(getStorageKey(userId), JSON.stringify(completed))
}

export function markVideoComplete(userId: string, videoId: string) {
  if (typeof window === 'undefined') return
  const current = getCompleted(userId)
  if (!current.includes(videoId)) {
    const next = [...current, videoId]
    setCompleted(userId, next)
    window.dispatchEvent(new Event('autolearn-progress-updated'))
    window.dispatchEvent(new Event('progress-updated'))
  }
}

// ── Progress Bar ──────────────────────────────────────────────
export function ProgressBar({ totalVideos }: { totalVideos: number }) {
  const { userId } = useAuth()
  const [completed, setCompletedState] = useState<string[]>([])

  useEffect(() => {
    if (userId) {
      setCompletedState(getCompleted(userId))
    }
  }, [userId])

  // Listen for custom event from MarkCompleteButton
  useEffect(() => {
    const handler = () => {
      if (userId) setCompletedState(getCompleted(userId))
    }
    window.addEventListener('progress-updated', handler)
    return () => window.removeEventListener('progress-updated', handler)
  }, [userId])

  const count = completed.length
  const pct = totalVideos > 0 ? Math.round((count / totalVideos) * 100) : 0

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
  const { userId } = useAuth()
  const [isDone, setIsDone] = useState(false)

  useEffect(() => {
    if (userId) {
      setIsDone(getCompleted(userId).includes(videoId))
    }
  }, [userId, videoId])

  useEffect(() => {
    const handler = () => {
      if (userId) setIsDone(getCompleted(userId).includes(videoId))
    }
    window.addEventListener('progress-updated', handler)
    return () => window.removeEventListener('progress-updated', handler)
  }, [userId, videoId])

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
  const { userId } = useAuth()
  const [isDone, setIsDone] = useState(false)

  useEffect(() => {
    if (userId) {
      setIsDone(getCompleted(userId).includes(videoId))
    }
  }, [userId, videoId])

  useEffect(() => {
    const handler = () => {
      if (userId) setIsDone(getCompleted(userId).includes(videoId))
    }
    window.addEventListener('progress-updated', handler)
    return () => window.removeEventListener('progress-updated', handler)
  }, [userId, videoId])

  if (!isDone) return null

  return (
    <div className="absolute top-2 left-2 flex items-center gap-1 rounded bg-emerald-500/90 px-2 py-1 font-mono text-[10px] font-bold uppercase text-white backdrop-blur">
      <CheckCircle className="h-3 w-3" />
      Done
    </div>
  )
}
