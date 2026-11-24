"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  PlayCircle, 
  Clock, 
  Lock, 
  Play, 
  Pause,
  Volume2,
  VolumeX,
  X, 
  Sparkles, 
  MessageCircle, 
  ArrowRight, 
  Loader2, 
  RotateCcw,
  ChevronUp,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { fbqAddToCart } from '@/lib/meta-pixel';

interface Lesson {
  id: string;
  title: string;
  description?: string | null;
  duration_label?: string | null;
  youtube_video_id?: string | null;
  vimeo_video_id?: string | null;
  order_index?: number;
}

interface Product {
  id: string;
  title: string;
  price: number;
  currency: string;
}

const PREVIEW_LIMIT_SECONDS = 270; // 4 minutes 30 seconds

function cleanVideoId(val?: string | null): string {
  if (!val) return '';
  if (val.includes('youtu.be/')) {
    return val.split('youtu.be/')[1]?.split('?')[0] || '';
  }
  if (val.includes('watch?v=')) {
    return val.split('watch?v=')[1]?.split('&')[0] || '';
  }
  return val.trim();
}

export default function CurriculumWithPreview({
  lessons,
  product,
  isEnrolled = false,
}: {
  lessons: Lesson[];
  product: Product;
  isEnrolled?: boolean;
}) {
  const router = useRouter();
  const [expandedPreviewId, setExpandedPreviewId] = useState<string | null>(null);
  const [isPaywallTriggered, setIsPaywallTriggered] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [iframeKey, setIframeKey] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const maxWatchedTimeRef = useRef(0);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency || 'NGN',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  // Toggle inline preview for a lesson
  const handleTogglePreview = (lesson: Lesson) => {
    if (expandedPreviewId === lesson.id) {
      setExpandedPreviewId(null);
      setIsPaywallTriggered(false);
      setCurrentTime(0);
    } else {
      setExpandedPreviewId(lesson.id);
      setIsPaywallTriggered(false);
      setCurrentTime(0);
      maxWatchedTimeRef.current = 0;
      setIframeKey((prev) => prev + 1);

      // Smooth scroll into view on mobile
      setTimeout(() => {
        previewContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  };

  const handleClosePreview = () => {
    setExpandedPreviewId(null);
    setIsPaywallTriggered(false);
    setCurrentTime(0);
    maxWatchedTimeRef.current = 0;
  };

  // Enroll Now: Add to cart & redirect to /cart
  const handleEnrollNow = async () => {
    setIsEnrolling(true);
    try {
      await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ learningProductId: product.id }),
      });

      try {
        fbqAddToCart({
          content_id: product.id,
          content_name: product.title,
          value: product.price,
          currency: product.currency || 'NGN',
        });
      } catch {}

      router.push('/cart');
    } catch (err) {
      console.error('Failed to add to cart:', err);
      router.push('/cart');
    } finally {
      setIsEnrolling(false);
    }
  };

  // Replay Preview
  const handleReplayPreview = () => {
    setIsPaywallTriggered(false);
    setCurrentTime(0);
    maxWatchedTimeRef.current = 0;
    setIsPlaying(true);
    setIframeKey((prev) => prev + 1);
    try {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: 'seekTo', args: [0, true] }),
        '*'
      );
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
        '*'
      );
    } catch {}
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }),
        '*'
      );
      setIsPlaying(false);
    } else {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
        '*'
      );
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: 'unMute', args: [] }),
        '*'
      );
      setIsMuted(false);
    } else {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func: 'mute', args: [] }),
        '*'
      );
      setIsMuted(true);
    }
  };

  // YouTube Iframe listener + active time polling + 4:30 Cutoff & anti-forwarding guard
  useEffect(() => {
    if (!expandedPreviewId) return;

    let pollTimer: NodeJS.Timeout | null = null;

    // Send handshakes & query currentTime continuously
    const pingIframe = () => {
      try {
        const win = iframeRef.current?.contentWindow;
        if (win) {
          win.postMessage(JSON.stringify({ event: 'listening' }), '*');
          win.postMessage(JSON.stringify({ event: 'command', func: 'getCurrentTime', args: [] }), '*');
          win.postMessage(JSON.stringify({ event: 'command', func: 'getPlayerState', args: [] }), '*');
        }
      } catch {}
    };

    pollTimer = setInterval(pingIframe, 500);
    const initialTimeout = setTimeout(pingIframe, 800);

    const handleMessage = (event: MessageEvent) => {
      try {
        if (!event.data) return;
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

        // When YouTube reaches state change (0 = ended, 1 = playing, 2 = paused)
        if (data?.event === 'onStateChange') {
          if (data.info === 0 && maxWatchedTimeRef.current >= 240) {
            setIsPaywallTriggered(true);
          }
          if (data.info === 1) setIsPlaying(true);
          if (data.info === 2) setIsPlaying(false);
        }

        // Real-time tracking of current playback time via infoDelivery
        if (data?.event === 'infoDelivery' && data?.info) {
          if (data.info.playerState !== undefined) {
            setIsPlaying(data.info.playerState === 1);
          }

          if (data.info.currentTime !== undefined) {
            const current = Number(data.info.currentTime);
            setCurrentTime(current);

            // Anti-forwarding protection: if user jumped forward > 3s beyond what they actually watched
            if (current > maxWatchedTimeRef.current + 3) {
              // Immediately freeze & lock with paywall
              setIsPaywallTriggered(true);
              iframeRef.current?.contentWindow?.postMessage(
                JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }),
                '*'
              );
            } else {
              maxWatchedTimeRef.current = Math.max(maxWatchedTimeRef.current, current);
            }

            // 4:30 Cutoff enforcement
            if (current >= PREVIEW_LIMIT_SECONDS) {
              setIsPaywallTriggered(true);
              iframeRef.current?.contentWindow?.postMessage(
                JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }),
                '*'
              );
            }
          }
        }
      } catch {}
    };

    window.addEventListener('message', handleMessage);
    return () => {
      if (pollTimer) clearInterval(pollTimer);
      clearTimeout(initialTimeout);
      window.removeEventListener('message', handleMessage);
    };
  }, [expandedPreviewId]);

  if (!lessons || lessons.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-8 text-center">
        <p className="text-muted-foreground">Curriculum details are being updated by the author.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
      {lessons.map((lesson, idx) => {
        // Free preview allowed for the first lesson or if explicitly marked
        const isFreePreview = !isEnrolled && idx === 0 && Boolean(lesson.youtube_video_id || lesson.vimeo_video_id);
        const isExpanded = expandedPreviewId === lesson.id;
        const cleanYtId = cleanVideoId(lesson.youtube_video_id);

        return (
          <div
            key={lesson.id || idx}
            ref={isExpanded ? previewContainerRef : undefined}
            className={`transition-colors ${
              isFreePreview ? 'bg-brand-primary/[0.03]' : 'hover:bg-muted/30'
            }`}
          >
            {/* Header row */}
            <div 
              className={`p-4 sm:p-6 flex items-start justify-between gap-4 ${
                isFreePreview ? 'cursor-pointer hover:bg-brand-primary/[0.06]' : ''
              }`}
              onClick={() => {
                if (isFreePreview) handleTogglePreview(lesson);
              }}
            >
              <div className="flex gap-4 items-start">
                <div className="shrink-0 mt-1">
                  {isFreePreview ? (
                    <div className="w-8 h-8 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                  ) : isEnrolled ? (
                    <PlayCircle className="w-6 h-6 text-brand-primary/60" />
                  ) : (
                    <Lock className="w-5 h-5 text-muted-foreground/60 mt-0.5" />
                  )}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-muted-foreground">Lesson {idx + 1}</span>
                    {isFreePreview && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-0.5 rounded-full">
                        <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Free Preview (4:30)
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-foreground text-base sm:text-lg mb-1">{lesson.title}</h4>
                  {lesson.description && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{lesson.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    {lesson.duration_label || 'Self-paced'}
                  </div>
                </div>
              </div>

              {/* Action button */}
              <div className="shrink-0">
                {isFreePreview ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTogglePreview(lesson);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                      isExpanded
                        ? 'bg-muted hover:bg-muted/80 text-foreground border border-border'
                        : 'bg-brand-primary text-primary-foreground hover:bg-brand-primary-hover'
                    }`}
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" />
                        Close Preview
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-current" />
                        Watch Preview
                      </>
                    )}
                  </button>
                ) : isEnrolled ? (
                  <Link
                    href={`/dashboard/video/${lesson.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-muted text-foreground text-xs font-semibold hover:bg-muted/80 transition-all"
                  >
                    Watch
                  </Link>
                ) : (
                  <span className="text-xs text-muted-foreground/60 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Locked
                  </span>
                )}
              </div>
            </div>

            {/* INLINE PREVIEW PLAYER: Protected, Zero Space, Anti-Theft Watermark Overlays */}
            {isExpanded && isFreePreview && (
              <div className="px-4 pb-6 sm:px-6 animate-in fade-in duration-300">
                {/* 16:9 Video Box with zero dead space and right-click protection */}
                <div 
                  className="relative w-full aspect-video rounded-xl sm:rounded-2xl overflow-hidden bg-black border border-border shadow-2xl select-none"
                  onContextMenu={(e) => e.preventDefault()}
                >
                  {/* Top Live Progress Bar (Custom branded green bar) */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-30 pointer-events-none">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${Math.min(100, (currentTime / PREVIEW_LIMIT_SECONDS) * 100)}%` }}
                    />
                  </div>

                  {/* Floating Top Controls inside video */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 z-30 flex items-center justify-between pointer-events-none">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/95 text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-md">
                      <Sparkles className="w-3 h-3" /> Preview: {formatTime(currentTime)} / 4:30
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClosePreview();
                      }}
                      className="pointer-events-auto p-1.5 rounded-full bg-black/70 hover:bg-black/90 text-white border border-white/20 transition-all shadow-md backdrop-blur-md"
                      title="Close preview"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* The Video Iframe */}
                  {cleanYtId ? (
                    <iframe
                      ref={iframeRef}
                      key={iframeKey}
                      src={`https://www.youtube.com/embed/${cleanYtId}?enablejsapi=1&playsinline=1&autoplay=1&end=${PREVIEW_LIMIT_SECONDS}&rel=0&modestbranding=1&controls=0&disablekb=1&fs=0&iv_load_policy=3&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
                      title={lesson.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full border-0"
                    />
                  ) : lesson.vimeo_video_id ? (
                    <iframe
                      ref={iframeRef}
                      key={iframeKey}
                      src={`https://player.vimeo.com/video/${lesson.vimeo_video_id}?playsinline=1`}
                      title={lesson.title}
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full border-0"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                      Video preview is loading...
                    </div>
                  )}

                  {/*
                    ── SECURITY & ANTI-STEALING WATERMARK OVERLAYS ─────────────────────────
                    1. Top header blocker absorbs clicks on YouTube title, channel avatar & share
                    2. Bottom seek bar blocker completely absorbs all drags and touches
                    3. Brand watermark overlays YouTube watermark
                    4. Custom AutoLearn Spot player bar (NON-DRAGGABLE)
                  */}

                  {/* 1. TOP HEADER BLOCKER: Blocks clicks to YouTube channel / title / share */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-16 sm:h-20 z-20 bg-transparent cursor-default select-none"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onTouchStart={(e) => { e.stopPropagation(); }}
                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  />

                  {/* 2. BOTTOM DRAG & SEEK BLOCKER: Absorbs all clicks & drag attempts */}
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-16 sm:h-20 z-20 bg-transparent cursor-default select-none pointer-events-auto"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onTouchStart={(e) => { e.stopPropagation(); }}
                    onTouchMove={(e) => { e.stopPropagation(); }}
                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  />

                  {/* 3. CUSTOM BRANDED CONTROLS BAR: Non-draggable, zero scrubber */}
                  <div className="absolute bottom-0 left-0 right-0 z-30 p-2 sm:p-3 bg-gradient-to-t from-black/95 via-black/70 to-transparent flex items-center justify-between gap-2 sm:gap-3 select-none">
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          togglePlayPause();
                        }}
                        className="p-1.5 sm:p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors backdrop-blur-sm cursor-pointer shadow-sm"
                        title={isPlaying ? "Pause Preview" : "Play Preview"}
                      >
                        {isPlaying ? <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" /> : <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current ml-0.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleMute();
                        }}
                        className="p-1.5 sm:p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors backdrop-blur-sm cursor-pointer"
                        title={isMuted ? "Unmute" : "Mute"}
                      >
                        {isMuted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                      </button>
                      <span className="text-white text-[10px] sm:text-xs font-mono font-bold select-none whitespace-nowrap">
                        {formatTime(currentTime)} <span className="text-white/40">/ 4:30</span>
                      </span>
                    </div>

                    {/* STRICTLY NON-DRAGGABLE PREVIEW PROGRESS BAR */}
                    <div className="flex-1 mx-1 sm:mx-3 h-1.5 sm:h-2 bg-white/20 rounded-full overflow-hidden select-none pointer-events-none">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (currentTime / PREVIEW_LIMIT_SECONDS) * 100)}%` }}
                      />
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleReplayPreview();
                        }}
                        className="p-1 sm:p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors backdrop-blur-sm text-[10px] sm:text-[11px] flex items-center gap-1 font-semibold px-2 cursor-pointer"
                        title="Replay from start"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span className="hidden sm:inline">Restart</span>
                      </button>
                    </div>
                  </div>

                  {/* 4. BRAND WATERMARK: Overlays channel watermark so it looks 100% proprietary */}
                  <div className="absolute bottom-14 right-3 z-20 pointer-events-none select-none flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/70 border border-white/10 backdrop-blur-sm opacity-70">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[10px] font-mono font-bold tracking-wider text-white">
                      AutoLearn Spot
                    </span>
                  </div>

                  {/* 4:30 Enforced Paywall Trigger */}
                  {isPaywallTriggered && (
                    <div className="absolute inset-0 z-40 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 text-center animate-in fade-in duration-200 overflow-y-auto">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] sm:text-xs font-bold uppercase mb-2">
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Free Preview Ended • 4m 30s</span>
                      </div>

                      <h3 className="text-base sm:text-xl font-heading font-extrabold text-white mb-1.5 leading-tight">
                        Ready to Master the Full Skill?
                      </h3>

                      <p className="text-[11px] sm:text-xs text-slate-300 max-w-sm mb-4 leading-relaxed">
                        You’ve finished the 4:30 preview! Enroll now to unlock all {lessons.length} complete lessons, verified certificate, and lifetime community access.
                      </p>

                      <div className="w-full max-w-xs space-y-2">
                        <button
                          onClick={handleEnrollNow}
                          disabled={isEnrolling}
                          className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white font-bold text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition-all"
                        >
                          {isEnrolling ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Opening Checkout...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                              <span>Enroll Now • {formatPrice(product.price, product.currency)}</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>

                        <a
                          href={`https://wa.me/2348120934828?text=${encodeURIComponent(`Hello Femi! I want to pay for "${product.title}" via direct bank transfer.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2 px-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold text-[10px] sm:text-xs flex items-center justify-center gap-1.5 transition-colors text-center"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          Prefer Direct Transfer? Chat on WhatsApp
                        </a>

                        <button
                          onClick={handleReplayPreview}
                          className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-slate-400 hover:text-slate-200 transition-colors pt-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Replay 4:30 Preview
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Micro Action Bar right under video */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    Previewing Lesson 1 • Unlock all {lessons.length} lessons & certificate
                  </span>
                  <div className="flex items-center gap-3">
                    <a
                      href={`https://wa.me/2348120934828?text=${encodeURIComponent(`Hello Femi! I'm watching the preview for "${product.title}" and want to pay via bank transfer.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1"
                    >
                      <MessageCircle className="w-3 h-3" />
                      Chat with Femi (08120934828)
                    </a>
                    <button
                      onClick={handleClosePreview}
                      className="text-muted-foreground hover:text-foreground font-medium underline"
                    >
                      Collapse
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
