'use client'

interface VimeoPlayerProps {
  videoId: string
}

export default function VimeoPlayer({ videoId }: VimeoPlayerProps) {
  return (
    <iframe
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
