'use client'

import { X, Lock } from 'lucide-react'
import { type ReactNode, useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Player from '@vimeo/player'
import { EnrollModal } from './enroll-modal'

interface PreviewVideoModalProps {
  children: ReactNode
  className?: string
  vimeoVideoId: string
}

const PREVIEW_LIMIT_SECONDS = 90

export function PreviewVideoModal({ children, className = '', vimeoVideoId }: PreviewVideoModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const modalTitleId = useMemo(() => 'preview-modal-title', [])

  // Single persistent iframe ref — never unmounts after first mount
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const playerRef = useRef<Player | null>(null)
  const isLockedRef = useRef(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Create the Player once, attach the 90s listener — never recreated
  useEffect(() => {
    if (!isMounted || !iframeRef.current || playerRef.current) return

    const player = new Player(iframeRef.current)
    playerRef.current = player

    const handleTimeUpdate = (data: { seconds: number }) => {
      if (data.seconds >= PREVIEW_LIMIT_SECONDS && !isLockedRef.current) {
        isLockedRef.current = true
        player.pause().catch(() => {})
        setIsLocked(true)
      }
    }

    player.on('timeupdate', handleTimeUpdate)

    return () => {
      player.off('timeupdate')
      playerRef.current = null
    }
  }, [isMounted])

  // Play/pause based on modal open state
  useEffect(() => {
    if (!playerRef.current) return
    if (isOpen && !isLockedRef.current) {
      playerRef.current.play().catch(() => {})
    } else {
      playerRef.current.pause().catch(() => {})
    }
  }, [isOpen])

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
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
    playerRef.current?.pause().catch(() => {})
  }, [])

  const handleOpen = useCallback(() => {
    if (isLockedRef.current && playerRef.current) {
      playerRef.current.setCurrentTime(0).catch(() => {})
      isLockedRef.current = false
      setIsLocked(false)
    }
    setIsOpen(true)
  }, [])

  return (
    <>
      <button className={className} onClick={handleOpen} type="button">
        {children}
      </button>

      {isMounted &&
        createPortal(
          <>
            {/*
              ONE iframe — always in the DOM.
              When modal is closed: positioned off-screen (invisible).
              When modal is open: moved into the modal overlay via CSS.
              This keeps the Player instance and its timeupdate listener alive.
            */}
            <div
              style={
                isOpen
                  ? {
                      position: 'fixed',
                      inset: 0,
                      zIndex: 100,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '1rem',
                      background: 'rgba(5,5,5,0.90)',
                      backdropFilter: 'blur(12px)',
                    }
                  : {
                      position: 'fixed',
                      top: '-9999px',
                      left: '-9999px',
                      width: '1px',
                      height: '1px',
                      overflow: 'hidden',
                      pointerEvents: 'none',
                      opacity: 0,
                    }
              }
              aria-hidden={!isOpen}
            >
              {/* Backdrop click to close */}
              {isOpen && (
                <button
                  aria-label="Close preview"
                  className="absolute inset-0 cursor-default"
                  onClick={handleClose}
                  type="button"
                />
              )}

              <div
                className={
                  isOpen
                    ? 'relative w-full max-w-[900px] border border-[#3b494b] bg-black shadow-[0_30px_100px_rgba(0,240,255,0.15)] animate-in fade-in zoom-in-95 duration-200'
                    : 'sr-only'
                }
                role={isOpen ? 'dialog' : undefined}
                aria-modal={isOpen ? 'true' : undefined}
                aria-labelledby={isOpen ? modalTitleId : undefined}
              >
                {isOpen && (
                  <>
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[#00f0ff]" />
                    <button
                      aria-label="Close"
                      className="absolute -right-3 -top-3 z-[110] flex h-8 w-8 items-center justify-center rounded-full border border-[#00f0ff]/50 bg-[#0c0e12] text-[#00f0ff] transition hover:border-[#00f0ff] hover:bg-[#00f0ff] hover:text-black sm:-right-4 sm:-top-4 sm:h-10 sm:w-10"
                      onClick={handleClose}
                      type="button"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                )}

                <div className={isOpen ? 'relative aspect-video w-full bg-[#111317]' : ''}>
                  {/* THE single iframe — ref never changes */}
                  <iframe
                    ref={iframeRef}
                    src={`https://player.vimeo.com/video/${vimeoVideoId}?badge=0&autopause=0&player_id=0&app_id=58479&dnt=1`}
                    style={
                      isOpen
                        ? {
                            border: 0,
                            width: '100%',
                            height: '100%',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                          }
                        : { border: 0, width: '1px', height: '1px' }
                    }
                    allowFullScreen={isOpen}
                    allow="autoplay; fullscreen; picture-in-picture; clipboard-write"
                    title="Vimeo preview player"
                  />

                  {/* Lock overlay after 90 seconds */}
                  {isOpen && isLocked && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#050505]/90 backdrop-blur-md animate-in fade-in duration-500">
                      <Lock className="mb-4 h-12 w-12 text-[#00f0ff] opacity-80" />
                      <h3
                        id={modalTitleId}
                        className="mb-2 font-heading text-2xl font-bold uppercase text-white"
                      >
                        Preview Complete
                      </h3>
                      <p className="mb-6 font-mono text-sm text-[#b9cacb] max-w-md text-center leading-relaxed">
                        You&apos;ve reached the end of the preview. Enroll now to unlock the full
                        course, live deployments, and get certified.
                      </p>
                      <EnrollModal className="corner-accent relative inline-flex h-12 items-center justify-center border border-[#00f0ff] bg-[#00f0ff] px-6 font-mono text-xs font-bold uppercase tracking-[0.1em] text-[#00363a] shadow-[0_14px_34px_rgba(0,240,255,0.18)] transition hover:bg-[#dbfcff]">
                        Enroll Now to Unlock
                      </EnrollModal>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>,
          document.body,
        )}
    </>
  )
}
