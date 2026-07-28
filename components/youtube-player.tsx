'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import { markVideoComplete } from '@/components/progress-tracker'
import { migrationLog } from '@/utils/migration-logger'
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react'
// YT namespace and Window extension are declared in types/youtube.d.ts

interface YouTubePlayerProps {
  videoId: string
  lessonId: string
  /** Resume playback from this position in seconds (from progress API) */
  resumeFromSeconds?: number
}

// Singleton: load the YouTube Iframe API script only once
let ytApiLoaded = false
let ytApiLoadPromise: Promise<void> | null = null

function loadYouTubeAPI(): Promise<void> {
  if (ytApiLoaded && window.YT?.Player) {
    return Promise.resolve()
  }

  if (ytApiLoadPromise) return ytApiLoadPromise

  ytApiLoadPromise = new Promise<void>((resolve) => {
    // If the script was already injected by another component mount
    if (window.YT?.Player) {
      ytApiLoaded = true
      resolve()
      return
    }

    const existingCallback = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      ytApiLoaded = true
      if (existingCallback) existingCallback()
      resolve()
    }

    // Avoid duplicate script tags
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      tag.async = true
      document.head.appendChild(tag)
    }
  })

  return ytApiLoadPromise
}

export default function YouTubePlayer({ videoId, lessonId, resumeFromSeconds }: YouTubePlayerProps) {
  const { userId } = useAuth()
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YT.Player | null>(null)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const markedCompleteRef = useRef(false)
  const lastSavedTimeRef = useRef(0)
  const lastSavedPctRef = useRef(0)
  const hasResumedRef = useRef(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Save progress to the server — reuses the existing /api/progress endpoint
  const saveProgress = useCallback(
    async (currentTime: number, duration: number, forceComplete = false) => {
      if (!userId || duration <= 0) return

      const watchPct = (currentTime / duration) * 100
      const payload: Record<string, unknown> = {
        lessonId,
        watchPct,
        lastPositionSeconds: currentTime,
      }

      // Mark complete when >= 90% watched
      if (!markedCompleteRef.current && (watchPct >= 90 || forceComplete)) {
        markedCompleteRef.current = true
        payload.completed = true
        migrationLog.completion(lessonId, watchPct)
        markVideoComplete(userId, lessonId)
      }

      // Throttle: save every 15 seconds or 5% progress
      const timeDiff = Math.abs(currentTime - lastSavedTimeRef.current)
      const pctDiff = Math.abs(watchPct - lastSavedPctRef.current)

      if (timeDiff < 15 && pctDiff < 5 && !payload.completed) return

      lastSavedTimeRef.current = currentTime
      lastSavedPctRef.current = watchPct

      migrationLog.progressSave(lessonId, watchPct, currentTime)

      try {
        await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } catch (err) {
        migrationLog.progressSaveError(lessonId, err)
      }
    },
    [userId, lessonId]
  )

  // Save progress on page unload / navigation
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!playerRef.current || !userId) return
      try {
        const currentTime = playerRef.current.getCurrentTime()
        const duration = playerRef.current.getDuration()
        if (duration > 0) {
          const watchPct = (currentTime / duration) * 100
          // Use sendBeacon for reliability on unload
          const payload = JSON.stringify({
            lessonId,
            watchPct,
            lastPositionSeconds: currentTime,
          })
          navigator.sendBeacon(
            '/api/progress',
            new Blob([payload], { type: 'application/json' })
          )
          migrationLog.progressSave(lessonId, watchPct, currentTime)
        }
      } catch {
        // Player may already be destroyed
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [userId, lessonId])

  // Initialise YouTube player
  useEffect(() => {
    if (!videoId || !containerRef.current) return

    let destroyed = false

    const init = async () => {
      try {
        await loadYouTubeAPI()
        if (destroyed || !containerRef.current) return

        // Create a placeholder div inside the container for YT.Player to replace
        const playerDiv = document.createElement('div')
        playerDiv.id = `yt-player-${lessonId}`
        containerRef.current.innerHTML = ''
        containerRef.current.appendChild(playerDiv)

        playerRef.current = new window.YT.Player(playerDiv.id, {
          videoId,
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: 0,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: YT.PlayerEvent) => {
              setIsLoading(false)
              migrationLog.mount(lessonId, 'youtube', 'v2')

              // Resume from saved position if provided
              if (
                resumeFromSeconds &&
                resumeFromSeconds > 0 &&
                !hasResumedRef.current
              ) {
                hasResumedRef.current = true
                event.target.seekTo(resumeFromSeconds, true)
                migrationLog.resume(lessonId, resumeFromSeconds)
              }
            },
            onStateChange: (event: YT.OnStateChangeEvent) => {
              const player = event.target

              if (event.data === window.YT.PlayerState.PLAYING) {
                migrationLog.playback(lessonId, 'youtube', videoId)

                // Start progress tracking interval (every 15 seconds)
                if (progressIntervalRef.current) {
                  clearInterval(progressIntervalRef.current)
                }
                progressIntervalRef.current = setInterval(() => {
                  try {
                    const currentTime = player.getCurrentTime()
                    const duration = player.getDuration()
                    saveProgress(currentTime, duration)
                  } catch {
                    // Player may be unavailable
                  }
                }, 15000)
              }

              if (event.data === window.YT.PlayerState.PAUSED) {
                // Save immediately on pause
                try {
                  const currentTime = player.getCurrentTime()
                  const duration = player.getDuration()
                  migrationLog.pause(lessonId, currentTime)
                  saveProgress(currentTime, duration)
                } catch {
                  // Player may be unavailable
                }

                // Stop interval
                if (progressIntervalRef.current) {
                  clearInterval(progressIntervalRef.current)
                  progressIntervalRef.current = null
                }
              }

              if (event.data === window.YT.PlayerState.ENDED) {
                // Video finished — save 100% progress
                try {
                  const duration = player.getDuration()
                  saveProgress(duration, duration, true)
                } catch {
                  // Player may be unavailable
                }

                if (progressIntervalRef.current) {
                  clearInterval(progressIntervalRef.current)
                  progressIntervalRef.current = null
                }
              }
            },
            onError: (event: YT.OnErrorEvent) => {
              const errorMessages: Record<number, string> = {
                2: 'Invalid video ID. Please contact support.',
                5: 'This video cannot be played in an embedded player.',
                100: 'This video is unavailable or has been removed.',
                101: 'The video owner does not allow embedded playback.',
                150: 'The video owner does not allow embedded playback.',
              }
              const msg = errorMessages[event.data] || `YouTube player error (code ${event.data})`
              setError(msg)
              setIsLoading(false)
              migrationLog.error(lessonId, msg, event.data)
            },
          },
        })
      } catch (err) {
        if (!destroyed) {
          setError('Failed to load the YouTube player. Please try refreshing.')
          setIsLoading(false)
          migrationLog.error(lessonId, 'Init failed', err)
        }
      }
    }

    init()

    return () => {
      destroyed = true
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
      if (playerRef.current) {
        try {
          playerRef.current.destroy()
        } catch {
          // Already destroyed
        }
        playerRef.current = null
      }
    }
  }, [videoId, lessonId, resumeFromSeconds, saveProgress])

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-[#0c0e12] p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
          <AlertCircle className="h-8 w-8 text-red-400" />
        </div>
        <div>
          <p className="font-mono text-sm font-semibold text-red-400">{error}</p>
          <p className="mt-1 font-mono text-xs text-[#b9cacb]">
            Video ID: {videoId}
          </p>
        </div>
        <button
          onClick={() => {
            setError(null)
            setIsLoading(true)
            markedCompleteRef.current = false
            hasResumedRef.current = false
          }}
          className="flex items-center gap-2 border border-[#3b494b] bg-[#111317] px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-[#00f0ff] transition-colors hover:border-[#00f0ff] hover:bg-[#1a1d24]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#0c0e12]">
          <Loader2 className="h-8 w-8 animate-spin text-[#00f0ff]" />
          <p className="font-mono text-xs uppercase tracking-widest text-[#b9cacb]">
            Loading video…
          </p>
        </div>
      )}
      <div
        ref={containerRef}
        className="h-full w-full"
        style={{ position: 'absolute', top: 0, left: 0 }}
      />
    </div>
  )
}
