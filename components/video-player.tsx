'use client'

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
 * YouTube (V2) is now the permanent engine for ALL users on ALL devices.
 * The localStorage toggle has been removed — migration is complete.
 *
 * Legacy Vimeo/VdoCipher are kept as a safety fallback only if no
 * YouTube ID is mapped for a given lesson.
 */
export default function VideoPlayer({
  lessonId,
  youtubeVideoId,
  vimeoVideoId,
  vdoCipherVideoId,
  resumeFromSeconds,
}: VideoPlayerProps) {
  // ── V2: YouTube Iframe API (permanent engine for all devices) ────
  if (youtubeVideoId) {
    migrationLog.mount(lessonId, 'youtube', 'v2')
    return (
      <YouTubePlayer
        videoId={youtubeVideoId}
        lessonId={lessonId}
        resumeFromSeconds={resumeFromSeconds}
      />
    )
  }

  // ── Fallback: Legacy — only if no YouTube ID is mapped yet ───────
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
