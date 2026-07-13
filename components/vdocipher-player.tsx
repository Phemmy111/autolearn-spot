'use client'

import { useEffect, useState } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'

interface VdoCipherPlayerProps {
  videoId: string
}

export default function VdoCipherPlayer({ videoId }: VdoCipherPlayerProps) {
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
