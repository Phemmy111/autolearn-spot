'use client'

import { X, Play, Lock } from 'lucide-react'
import { type ReactNode, useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Player from '@vimeo/player'
import { EnrollModal } from './enroll-modal'

interface PreviewVideoModalProps {
  children: ReactNode
  className?: string
  vimeoVideoId: string
}

export function PreviewVideoModal({ children, className = '', vimeoVideoId }: PreviewVideoModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const modalTitleId = useMemo(() => 'preview-modal-title', [])
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const playerRef = useRef<Player | null>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Preload: initialize Vimeo Player as soon as the iframe mounts (even while hidden)
  useEffect(() => {
    if (!isMounted || !iframeRef.current || playerRef.current) return

    const player = new Player(iframeRef.current)
    playerRef.current = player

    player.on('timeupdate', function(data) {
      if (data.seconds >= 90) { // 1m 30s
        player.pause()
        setIsLocked(true)
      }
    })

    return () => {
      player.off('timeupdate')
      playerRef.current = null
    }
  }, [isMounted])

  // When modal opens, start playing
  useEffect(() => {
    if (isOpen && playerRef.current && !isLocked) {
      playerRef.current.play().catch(() => {
        // Autoplay may be blocked by browser — user will press play manually
      })
    }
  }, [isOpen, isLocked])

  useEffect(() => {
    if (!isOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose()
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen])

  const handleClose = useCallback(() => {
    setIsOpen(false)
    // Pause the video when closing
    if (playerRef.current) {
      playerRef.current.pause().catch(() => {})
    }
    setTimeout(() => setIsLocked(false), 300)
  }, [])

  const handleOpen = useCallback(() => {
    // Reset to beginning if it was locked before
    if (isLocked && playerRef.current) {
      playerRef.current.setCurrentTime(0).catch(() => {})
      setIsLocked(false)
    }
    setIsOpen(true)
  }, [isLocked])

  return (
    <>
      <button className={className} onClick={handleOpen} type="button">
        {children}
      </button>

      {/* Hidden preloaded iframe — loads in background before user clicks */}
      {isMounted && (
        <div
          style={{
            position: isOpen ? undefined : 'fixed',
            width: isOpen ? undefined : '1px',
            height: isOpen ? undefined : '1px',
            overflow: isOpen ? undefined : 'hidden',
            opacity: isOpen ? undefined : 0,
            pointerEvents: isOpen ? undefined : 'none',
            top: isOpen ? undefined : '-9999px',
            left: isOpen ? undefined : '-9999px',
          }}
        >
          {!isOpen && (
            <iframe
              ref={iframeRef}
              src={`https://player.vimeo.com/video/${vimeoVideoId}?badge=0&autopause=0&player_id=0&app_id=58479&dnt=1&preload=auto`}
              style={{
                border: 0,
                width: '1px',
                height: '1px',
              }}
              allow="autoplay; fullscreen; picture-in-picture; clipboard-write"
              title="Vimeo teaser player preload"
            />
          )}
        </div>
      )}

      {isOpen && isMounted
        ? createPortal(
            <div
              aria-labelledby={modalTitleId}
              aria-modal="true"
              className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#050505]/90 px-3 py-4 backdrop-blur-md sm:px-6 sm:py-8"
              role="dialog"
            >
              <button
                aria-label="Close preview"
                className="absolute inset-0 cursor-default"
                onClick={handleClose}
                type="button"
              />

              <div className="relative w-full max-w-[900px] border border-[#3b494b] bg-black shadow-[0_30px_100px_rgba(0,240,255,0.15)] animate-in fade-in zoom-in-95 duration-200">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[#00f0ff]" />

                <button
                  aria-label="Close"
                  className="absolute -right-3 -top-3 z-[110] flex h-8 w-8 items-center justify-center rounded-full border border-[#00f0ff]/50 bg-[#0c0e12] text-[#00f0ff] transition hover:border-[#00f0ff] hover:bg-[#00f0ff] hover:text-black sm:-right-4 sm:-top-4 sm:h-10 sm:w-10"
                  onClick={handleClose}
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="relative aspect-video w-full bg-[#111317]">
                  {/* The Vimeo Player Iframe */}
                  <iframe
                    ref={iframeRef}
                    src={`https://player.vimeo.com/video/${vimeoVideoId}?badge=0&autopause=0&player_id=0&app_id=58479&dnt=1&autoplay=1`}
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
                    title="Vimeo teaser player"
                  />
                  
                  {/* Lock Overlay */}
                  {isLocked && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#050505]/90 backdrop-blur-md animate-in fade-in duration-500">
                       <Lock className="mb-4 h-12 w-12 text-[#00f0ff] opacity-80" />
                       <h3 className="mb-2 font-heading text-2xl font-bold uppercase text-white">Preview Complete</h3>
                       <p className="mb-6 font-mono text-sm text-[#b9cacb] max-w-md text-center leading-relaxed">
                         You've reached the end of the preview. Enroll now to unlock the full course, live deployments, and get certified.
                       </p>
                       <EnrollModal className="corner-accent relative inline-flex h-12 items-center justify-center border border-[#00f0ff] bg-[#00f0ff] px-6 font-mono text-xs font-bold uppercase tracking-[0.1em] text-[#00363a] shadow-[0_14px_34px_rgba(0,240,255,0.18)] transition hover:bg-[#dbfcff]">
                         Enroll Now to Unlock
                       </EnrollModal>
                    </div>
                  )}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
