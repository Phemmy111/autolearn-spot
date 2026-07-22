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
    let marked = false

    const initPlayer = () => {
      if (iframeRef.current && window.VdoPlayer) {
        player = window.VdoPlayer.getInstance(iframeRef.current)
        
        player.video.addEventListener('timeupdate', () => {
          if (!player.video.duration) return
          const percent = player.video.currentTime / player.video.duration
          if (!marked && percent > 0.9 && userId) {
            marked = true
            markVideoComplete(userId, lessonId)
          }
        })
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
      if (player && player.video) {
        // VdoPlayer doesn't have an explicit unload/destroy that we need to manage here,
        // but we would ideally removeEventListener if we kept the reference to the handler.
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
        <Loader2 className="h-8 w-8 animate-spin text-[#00f0ff]" />
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
