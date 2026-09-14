'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import { markVideoComplete } from '@/components/progress-tracker'
import { migrationLog } from '@/utils/migration-logger'
import { Loader2, AlertCircle, RefreshCw, Play, Pause, Rewind, FastForward, Maximize } from 'lucide-react'
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
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const progressBarRef = useRef<HTMLDivElement>(null)

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

        new window.YT.Player(playerDiv.id, {
          videoId,
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: 1,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            enablejsapi: 1,
            origin: window.location.origin,
            controls: 1,
          },
          events: {
            onReady: (event: YT.PlayerEvent) => {
              console.log('[YouTubePlayer] onReady fired - setting isLoading to false')
              playerRef.current = event.target
              setIsLoading(false)
              
              // Force hide loading overlay after a short delay as fallback
              setTimeout(() => {
                setIsLoading(false)
              }, 1000)
              
              migrationLog.mount(lessonId, 'youtube', 'v2')

              // TEMPORARILY DISABLED: Crop the top title bar - this might be hiding the video
              // const iframe = containerRef.current?.querySelector('iframe')
              // if (iframe) {
              //   iframe.style.position = 'absolute'
              //   iframe.style.top = '-60px'
              //   iframe.style.left = '0'
              //   iframe.style.width = '100%'
              //   iframe.style.height = 'calc(100% + 120px)' // +60 top +60 bottom
              // }

              // TEMPORARILY DISABLED: Resume from saved position to fix video loading
            },
            onStateChange: (event: YT.OnStateChangeEvent) => {
              const player = event.target
              
              // Always update playerRef when we get a state change event
              if (!playerRef.current) {
                playerRef.current = player
              }

              if (event.data === window.YT.PlayerState.PLAYING) {
                setIsPlaying(true)
                migrationLog.playback(lessonId, 'youtube', videoId)

                // Start progress tracking interval (every 5 seconds for UI + 15s for server)
                if (progressIntervalRef.current) {
                  clearInterval(progressIntervalRef.current)
                }
                progressIntervalRef.current = setInterval(() => {
                  try {
                    const currentTime = player.getCurrentTime()
                    const duration = player.getDuration()
                    if (duration > 0) {
                      setProgress((currentTime / duration) * 100)
                    }
                    saveProgress(currentTime, duration)
                  } catch {
                    // Player may be unavailable
                  }
                }, 5000)
              }

              if (event.data === window.YT.PlayerState.PAUSED) {
                setIsPlaying(false)
                // Save immediately on pause
                try {
                  const currentTime = player.getCurrentTime()
                  const duration = player.getDuration()
                  if (duration > 0) {
                    setProgress((currentTime / duration) * 100)
                  }
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
                setIsPlaying(false)
                setProgress(100)
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
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-neutral-900 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
          <AlertCircle className="h-8 w-8 text-red-400" />
        </div>
        <div>
          <p className="font-mono text-sm font-semibold text-red-400">{error}</p>
          <p className="mt-1 font-mono text-xs text-neutral-500">
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
          className="flex items-center gap-2 border border-neutral-700 bg-neutral-800 px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-neutral-300 transition-colors hover:border-neutral-600 hover:bg-neutral-700"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
      </div>
    )
  }

  // Toggle play/pause via the API
  const handlePlayPause = useCallback(() => {
    if (!playerRef.current) return
    try {
      const playerState = playerRef.current.getPlayerState()
      console.log('[YouTubePlayer] Play/Pause clicked - Player state:', playerState)
      
      // Toggle based on actual player state
      if (playerState === window.YT.PlayerState.PLAYING) {
        playerRef.current.pauseVideo()
      } else {
        playerRef.current.playVideo()
      }
    } catch (err) {
      console.error('[YouTubePlayer] Play/Pause error:', err)
    }
  }, [])

  // Seek when clicking the progress bar
  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerRef.current || !progressBarRef.current) return
    try {
      const rect = progressBarRef.current.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const pct = clickX / rect.width
      const duration = playerRef.current.getDuration()
      if (duration > 0) {
        playerRef.current.seekTo(pct * duration, true)
        setProgress(pct * 100)
      }
    } catch {
      // Player may not be ready
    }
  }, [])

  // Fast forward 10 seconds
  const handleFastForward = useCallback(() => {
    if (!playerRef.current) return
    try {
      const currentTime = playerRef.current.getCurrentTime()
      const duration = playerRef.current.getDuration()
      console.log('[YouTubePlayer] Fast forward - Current time:', currentTime, 'Duration:', duration)
      const newTime = Math.min(currentTime + 10, duration)
      console.log('[YouTubePlayer] Fast forward - New time:', newTime)
      
      playerRef.current.seekTo(newTime, false)
      setProgress((newTime / duration) * 100)
    } catch (err) {
      console.error('[YouTubePlayer] Fast forward error:', err)
    }
  }, [])

  // Rewind 10 seconds
  const handleRewind = useCallback(() => {
    if (!playerRef.current) return
    try {
      const currentTime = playerRef.current.getCurrentTime()
      const duration = playerRef.current.getDuration()
      console.log('[YouTubePlayer] Rewind - Current time:', currentTime, 'Duration:', duration)
      const newTime = Math.max(currentTime - 10, 0)
      console.log('[YouTubePlayer] Rewind - New time:', newTime)
      
      playerRef.current.seekTo(newTime, false)
      setProgress((newTime / duration) * 100)
    } catch (err) {
      console.error('[YouTubePlayer] Rewind error:', err)
    }
  }, [])

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }, [])

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-black"
    >
      {/* The YouTube iframe */}
      <div
        ref={containerRef}
        className="absolute inset-0"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  )
}
