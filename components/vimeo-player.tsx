'use client'

import { useEffect, useRef } from 'react'
import Player from '@vimeo/player'
import { useAuth } from '@clerk/nextjs'
import { markVideoComplete } from '@/components/progress-tracker'

interface VimeoPlayerProps {
  videoId: string
  lessonId: string
}

export default function VimeoPlayer({ videoId, lessonId }: VimeoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const { userId } = useAuth()

  useEffect(() => {
    if (!iframeRef.current) return
    const player = new Player(iframeRef.current)
    let marked = false

    player.on('timeupdate', (data) => {
      // mark as complete if watched 90% or more
      if (!marked && data.percent > 0.9 && userId) {
        marked = true
        markVideoComplete(userId, lessonId)
      }
    })

    return () => {
      player.unload()
    }
  }, [videoId, userId])

  return (
    <iframe
      ref={iframeRef}
      src={`https://player.vimeo.com/video/${videoId}?badge=0&autopause=0&player_id=0&app_id=58479&dnt=1`}
      style={{
        border: 0,
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
      }}
      allowFullScreen={true}
      allow="autoplay; fullscreen; picture-in-picture; clipboard-write"
      title="Vimeo video player"
    />
  )
}
