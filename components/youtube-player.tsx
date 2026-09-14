'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import { markVideoComplete } from '@/components/progress-tracker'
import { migrationLog } from '@/utils/migration-logger'
import { Loader2, AlertCircle, RefreshCw, Rewind, FastForward, Maximize, RotateCw } from 'lucide-react'
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
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showRewindIndicator, setShowRewindIndicator] = useState(false)
  const [showForwardIndicator, setShowForwardIndicator] = useState(false)
  const controlsTimeoutRef = useRef<NodeJS.Timeout>()
  const lastTapRef = useRef<number>(0)

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
            disablekb: 1,
            fs: 0,
            // Hide ALL native controls (they contain the Share button)
            controls: 0,
            // Hide video annotations
            iv_load_policy: 3,
          },
          events: {
            onReady: (event: YT.PlayerEvent) => {
              setIsLoading(false)
              migrationLog.mount(lessonId, 'youtube', 'v2')

              const playerDuration = event.target.getDuration()
              setDuration(playerDuration)

              // Crop the top title bar by extending the iframe beyond the container
              const iframe = containerRef.current?.querySelector('iframe')
              if (iframe) {
                iframe.style.position = 'absolute'
                iframe.style.top = '-60px'
                iframe.style.left = '0'
                iframe.style.width = '100%'
                iframe.style.height = 'calc(100% + 120px)' // +60 top +60 bottom
              }

              // Resume from saved position if provided
              if (
                resumeFromSeconds &&
                resumeFromSeconds > 0 &&
                !hasResumedRef.current
              ) {
                hasResumedRef.current = true
                event.target.seekTo(resumeFromSeconds, true)
                setCurrentTime(resumeFromSeconds)
                migrationLog.resume(lessonId, resumeFromSeconds)
              }
            },
            onStateChange: (event: YT.OnStateChangeEvent) => {
              const player = event.target

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
                      setCurrentTime(currentTime)
                      setDuration(duration)
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

  // Auto-hide controls when playing (disabled for now to ensure controls are visible)
  useEffect(() => {
    // Disabled auto-hide to ensure controls are always visible
    // User can hide them by clicking outside
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
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
      if (isPlaying) {
        playerRef.current.pauseVideo()
      } else {
        playerRef.current.playVideo()
      }
    } catch {
      // Player may not be ready
    }
  }, [isPlaying])



  // Fast forward 10 seconds
  const handleFastForward = useCallback(() => {
    if (!playerRef.current) return
    try {
      const currentTime = playerRef.current.getCurrentTime()
      const duration = playerRef.current.getDuration()
      const newTime = Math.min(currentTime + 10, duration)
      playerRef.current.seekTo(newTime, true)
      setProgress((newTime / duration) * 100)
      setCurrentTime(newTime)

      // Show indicator
      setShowForwardIndicator(true)
      setTimeout(() => setShowForwardIndicator(false), 500)
    } catch {
      // Player may not be ready
    }
  }, [])

  // Rewind 10 seconds
  const handleRewind = useCallback(() => {
    if (!playerRef.current) return
    try {
      const currentTime = playerRef.current.getCurrentTime()
      const duration = playerRef.current.getDuration()
      const newTime = Math.max(currentTime - 10, 0)
      playerRef.current.seekTo(newTime, true)
      setProgress((newTime / duration) * 100)
      setCurrentTime(newTime)

      // Show indicator
      setShowRewindIndicator(true)
      setTimeout(() => setShowRewindIndicator(false), 500)
    } catch {
      // Player may not be ready
    }
  }, [])

  // Handle double-tap gestures and center tap
  const handleVideoClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const width = rect.width

    const now = Date.now()
    const timeSinceLastTap = now - lastTapRef.current

    // Left 30% - rewind on double-tap
    if (x < width * 0.3) {
      if (timeSinceLastTap < 300) {
        handleRewind()
        lastTapRef.current = 0
      } else {
        lastTapRef.current = now
      }
      return
    }

    // Right 30% - fast forward on double-tap
    if (x > width * 0.7) {
      if (timeSinceLastTap < 300) {
        handleFastForward()
        lastTapRef.current = 0
      } else {
        lastTapRef.current = now
      }
      return
    }

    // Center - play/pause on single tap
    handlePlayPause()
    setShowControls(true)
  }, [handlePlayPause, handleRewind, handleFastForward])

  // Format time helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden bg-black"
      onContextMenu={(e) => e.preventDefault()}
      onClick={handleVideoClick}
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-neutral-900">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
          <p className="font-mono text-xs uppercase tracking-widest text-neutral-500">
            Loading video…
          </p>
        </div>
      )}

      {/* The YouTube iframe (controls: 0 hides native UI) */}
      <div className="absolute inset-0" />

      {/* Double-tap indicators */}
      <div className="absolute inset-0 pointer-events-none flex justify-between px-8 z-10">
        <div className="w-1/3 h-full flex items-center justify-start">
          <div className={`flex items-center gap-2 bg-black/70 text-white px-4 py-3 rounded-lg backdrop-blur-sm transition-opacity ${showRewindIndicator ? 'opacity-100' : 'opacity-0'}`}>
            <RotateCw className="w-6 h-6 rotate-180" />
            <span className="text-sm font-bold">-10s</span>
          </div>
        </div>
        <div className="w-1/3 h-full flex items-center justify-end">
          <div className={`flex items-center gap-2 bg-black/70 text-white px-4 py-3 rounded-lg backdrop-blur-sm transition-opacity ${showForwardIndicator ? 'opacity-100' : 'opacity-0'}`}>
            <RotateCw className="w-6 h-6" />
            <span className="text-sm font-bold">+10s</span>
          </div>
        </div>
      </div>

      {/* Custom controls overlay */}
      {!isLoading && (
        <div
          className={`absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Progress bar */}
          <div className="mb-4">
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => {
                const pct = parseInt(e.target.value)
                if (playerRef.current && duration > 0) {
                  const newTime = (pct / 100) * duration
                  playerRef.current.seekTo(newTime, true)
                  setProgress(pct)
                  setCurrentTime(newTime)
                }
              }}
              className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform"
            />
          </div>

          {/* Control buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Play/Pause */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handlePlayPause()
                }}
                className="text-white hover:text-gray-300 transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-1" />
                )}
              </button>

              {/* Rewind */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleRewind()
                }}
                className="text-white hover:text-gray-300 transition-colors"
                title="Rewind 10s"
              >
                <Rewind className="w-5 h-5" />
              </button>

              {/* Time */}
              <span className="text-white text-sm font-medium">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>

              {/* Fast forward */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleFastForward()
                }}
                className="text-white hover:text-gray-300 transition-colors"
                title="Fast forward 10s"
              >
                <FastForward className="w-5 h-5" />
              </button>
            </div>

            {/* Fullscreen */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleFullscreen()
              }}
              className="text-white hover:text-gray-300 transition-colors"
              title="Fullscreen"
            >
              <Maximize className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
