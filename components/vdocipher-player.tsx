'use client'

import { useEffect, useState, useRef } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import { markVideoComplete } from '@/components/progress-tracker'

// Declare VdoPlayer on the window object
declare global {
  interface Window {
    VdoPlayer: any
    onVdoPlayerV2APIReady: () => void
  }
}

interface VdoCipherPlayerProps {
  videoId: string
  lessonId: string
}

export default function VdoCipherPlayer({ videoId, lessonId }: VdoCipherPlayerProps) {
  const { userId } = useAuth()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [otp, setOtp] = useState<string | null>(null)
  const [playbackInfo, setPlaybackInfo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setOtp(null)
    setPlaybackInfo(null)
    setError(null)

    fetch(`/api/vdocipher-otp/${videoId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.otp && data.playbackInfo) {
          setOtp(data.otp)
          setPlaybackInfo(data.playbackInfo)
        } else {
          setError(data.error || 'Failed to load video')
        }
      })
      .catch(() => setError('Unable to load video. Please try again.'))
  }, [videoId])

  useEffect(() => {
    if (!otp || !playbackInfo || !iframeRef.current) return

    let player: any = null
    let timeUpdateHandler: (() => void) | null = null
    let marked = false
    let lastSavedTime = 0
    let lastSavedPct = 0

    const initPlayer = () => {
      if (iframeRef.current && window.VdoPlayer) {
        player = window.VdoPlayer.getInstance(iframeRef.current)
        
        let progressInterval: NodeJS.Timeout | null = null

        const checkProgress = () => {
          if (!userId || !player || !player.video) return
          
          const currentTime = Number(player.video.currentTime)
          const duration = Number(player.video.duration)
          
          if (isNaN(currentTime) || isNaN(duration) || duration === 0) return
          
          const percent = currentTime / duration
          const watchPct = percent * 100
          
          if (!marked && percent > 0.9) {
            marked = true
            markVideoComplete(userId, lessonId)
          }

          if (currentTime - lastSavedTime >= 30 || watchPct - lastSavedPct >= 5) {
            lastSavedTime = currentTime
            lastSavedPct = watchPct
            
            fetch('/api/progress', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                lessonId, 
                watchPct, 
                lastPositionSeconds: currentTime 
              }),
            }).catch(e => console.error('Failed to save progress', e))
          }
        }
        
        timeUpdateHandler = checkProgress
        player.video.addEventListener('timeupdate', checkProgress)
        // Polling fallback to guarantee completion triggers even if events fail across iframe
        progressInterval = setInterval(checkProgress, 2000)
        
        // Attach interval to player for cleanup
        player._progressInterval = progressInterval
      }
    }

    if (!window.VdoPlayer) {
      const script = document.createElement('script')
      script.src = 'https://player.vdocipher.com/v2/api.js'
      script.async = true
      document.body.appendChild(script)
      window.onVdoPlayerV2APIReady = initPlayer
    } else {
      initPlayer()
    }

    return () => {
      if (player && player.video && timeUpdateHandler) {
        player.video.removeEventListener('timeupdate', timeUpdateHandler)
      }
      if (player && player._progressInterval) {
        clearInterval(player._progressInterval)
      }
    }
  }, [otp, playbackInfo, videoId, userId])

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="font-mono text-sm text-red-400">{error}</p>
      </div>
    )
  }

  if (!otp || !playbackInfo) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
        <p className="font-mono text-xs uppercase tracking-widest text-[#b9cacb]">
          Loading video…
        </p>
      </div>
    )
  }

  return (
    <iframe
      ref={iframeRef}
      src={`https://player.vdocipher.com/v2/?otp=${otp}&playbackInfo=${playbackInfo}`}
      style={{
        border: 0,
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
      }}
      allowFullScreen={true}
      allow="encrypted-media"
    />
  )
}
