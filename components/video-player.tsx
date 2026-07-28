'use client'

import { useEffect, useState } from 'react'
import { isVideoEngineV2 } from '@/utils/feature-toggle'
import { migrationLog } from '@/utils/migration-logger'
import YouTubePlayer from '@/components/youtube-player'
import VimeoPlayer from '@/components/vimeo-player'
import VdoCipherPlayer from '@/components/vdocipher-player'

interface VideoPlayerProps {
  lessonId: string
  /** YouTube video ID (V2 engine) */
  youtubeVideoId?: string
  /** Vimeo video ID (legacy) */
  vimeoVideoId?: string
  /** VdoCipher video ID (legacy) */
  vdoCipherVideoId?: string
  /** Resume position in seconds from saved progress */
  resumeFromSeconds?: number
}

/**
 * Provider-agnostic video player wrapper.
 * 
 * Selects the correct player implementation based on:
 * 1. The localStorage feature toggle (videoEngineV2 = 'true' → YouTube V2)
 * 2. Available video IDs (YouTube → Vimeo → VdoCipher fallback chain)
 * 
 * The legacy Vimeo/VdoCipher components are preserved intact.
 * Toggle can be flipped in browser console without redeployment:
 *   localStorage.setItem('videoEngineV2', 'true')  // enable V2
 *   localStorage.setItem('videoEngineV2', 'false') // revert to legacy
 */
export default function VideoPlayer({
  lessonId,
  youtubeVideoId,
  vimeoVideoId,
  vdoCipherVideoId,
  resumeFromSeconds,
}: VideoPlayerProps) {
  const [engine, setEngine] = useState<'v1' | 'v2' | null>(null)

  useEffect(() => {
    const v2 = isVideoEngineV2()
    setEngine(v2 ? 'v2' : 'v1')
  }, [])

  // Not yet determined (SSR / first paint) — show nothing to avoid flicker
  if (engine === null) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0c0e12]">
        <span className="font-mono text-xs uppercase tracking-widest text-[#b9cacb] animate-pulse">
          Loading player…
        </span>
      </div>
    )
  }

  // ── V2: YouTube Iframe API ──────────────────────────────────────
  if (engine === 'v2') {
    if (!youtubeVideoId) {
      migrationLog.error(lessonId, 'V2 enabled but no youtubeVideoId available — falling back to legacy')
      // Fall through to legacy
    } else {
      migrationLog.mount(lessonId, 'youtube', 'v2')
      return (
        <YouTubePlayer
          videoId={youtubeVideoId}
          lessonId={lessonId}
          resumeFromSeconds={resumeFromSeconds}
        />
      )
    }
  }

  // ── V1: Legacy — Vimeo preferred, then VdoCipher ────────────────
  if (vimeoVideoId) {
    migrationLog.mount(lessonId, 'vimeo', 'v1')
    return <VimeoPlayer videoId={vimeoVideoId} lessonId={lessonId} />
  }

  if (vdoCipherVideoId) {
    migrationLog.mount(lessonId, 'vdocipher', 'v1')
    return <VdoCipherPlayer videoId={vdoCipherVideoId} lessonId={lessonId} />
  }

  // No video source available
  return (
    <div className="flex h-full items-center justify-center font-mono text-sm text-[#b9cacb]">
      Video source not configured for this lesson.
    </div>
  )
}
