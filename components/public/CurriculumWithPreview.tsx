"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  PlayCircle, 
  Clock, 
  Lock, 
  Play, 
  Pause,
  X, 
  Sparkles, 
  CheckCircle2, 
  MessageCircle, 
  ArrowRight, 
  Loader2, 
  RotateCcw 
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
  const [activePreviewLesson, setActivePreviewLesson] = useState<Lesson | null>(null);
  const [isPaywallTriggered, setIsPaywallTriggered] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [iframeKey, setIframeKey] = useState(1);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const maxWatchedTimeRef = useRef(0);

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency || 'NGN',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatMinutesSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Lock body scroll when preview modal is active
  useEffect(() => {
    if (activePreviewLesson) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [activePreviewLesson]);

  // Send command to embedded YouTube iframe
  const sendCommand = (func: string, args: any = '') => {
    if (iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func, args }),
          '*'
        );
      } catch {}
    }
  };

  // Play / Pause toggle without allowing fast-forwarding
  const handleTogglePlay = () => {
    if (isPlaying) {
      sendCommand('pauseVideo');
      setIsPlaying(false);
    } else {
      sendCommand('playVideo');
      setIsPlaying(true);
    }
  };

  // Reset state when opening a new preview lesson
  const handleOpenPreview = (lesson: Lesson) => {
    setActivePreviewLesson(lesson);
    setIsPaywallTriggered(false);
    setElapsedSeconds(0);
    maxWatchedTimeRef.current = 0;
    setIsPlaying(true);
    setIframeKey((prev) => prev + 1);
  };

  const handleCloseModal = () => {
    setActivePreviewLesson(null);
    setIsPaywallTriggered(false);
    setElapsedSeconds(0);
    maxWatchedTimeRef.current = 0;
    setIsPlaying(false);
  };

  // Enroll Now Handler: Add to cart and redirect straight to /cart
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

  // Replay Preview Handler
  const handleReplayPreview = () => {
    setIsPaywallTriggered(false);
    setElapsedSeconds(0);
    maxWatchedTimeRef.current = 0;
    setIsPlaying(true);
    setIframeKey((prev) => prev + 1);
  };

  // YouTube Iframe listener + Anti-Fast-Forward Guard + 4:30 Cutoff
  useEffect(() => {
    if (!activePreviewLesson) return;

    // Listen for YouTube API readiness & request continuous info delivery
    const pingTimer = setInterval(() => {
      sendCommand('listening');
    }, 1000);

    const handleMessage = (event: MessageEvent) => {
      try {
        if (!event.data) return;
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        // YouTube Player State Change
        // 0: Ended, 1: Playing, 2: Paused
        if (data?.event === 'onStateChange') {
          if (data.info === 1) {
            setIsPlaying(true);
          } else if (data.info === 2) {
            setIsPlaying(false);
          } else if (data.info === 0) {
            setIsPlaying(false);
            setIsPaywallTriggered(true);
          }
        }

        // Real-time time update with Anti-Fast-Forward enforcement
        if (data?.event === 'infoDelivery' && data?.info?.currentTime !== undefined) {
          const current = data.info.currentTime;
          
          // Anti-forwarding guard: If video jumps ahead of legitimately watched time, snap it back
          if (current > maxWatchedTimeRef.current + 2.5) {
            sendCommand('seekTo', [maxWatchedTimeRef.current, true]);
          } else {
            maxWatchedTimeRef.current = Math.max(maxWatchedTimeRef.current, current);
            setElapsedSeconds(Math.floor(maxWatchedTimeRef.current));
          }

          // Hard stop at exactly 4:30 (270s)
          if (current >= PREVIEW_LIMIT_SECONDS) {
            sendCommand('pauseVideo');
            setIsPaywallTriggered(true);
            setIsPlaying(false);
          }
        }
      } catch {}
    };

    window.addEventListener('message', handleMessage);
    return () => {
      clearInterval(pingTimer);
      window.removeEventListener('message', handleMessage);
    };
  }, [activePreviewLesson]);

  // Fallback ticker if API postMessage is throttled
  useEffect(() => {
    if (!activePreviewLesson || isPaywallTriggered || !isPlaying) return;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        maxWatchedTimeRef.current = Math.max(maxWatchedTimeRef.current, next);
        if (next >= PREVIEW_LIMIT_SECONDS) {
          sendCommand('pauseVideo');
          setIsPaywallTriggered(true);
          setIsPlaying(false);
          return PREVIEW_LIMIT_SECONDS;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activePreviewLesson, isPaywallTriggered, isPlaying]);

  if (!lessons || lessons.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-8 text-center">
        <p className="text-muted-foreground">Curriculum details are being updated by the author.</p>
      </div>
    );
  }

  const cleanYtId = cleanVideoId(activePreviewLesson?.youtube_video_id);

  return (
    <>
      <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
        {lessons.map((lesson, idx) => {
          // Allow preview for the first lesson or if explicitly has a preview video
          const isFreePreview = !isEnrolled && idx === 0 && Boolean(lesson.youtube_video_id || lesson.vimeo_video_id);

          return (
            <div
              key={lesson.id || idx}
              className={`p-4 sm:p-6 transition-colors flex items-start justify-between gap-4 ${
                isFreePreview ? 'bg-brand-primary/[0.03] hover:bg-brand-primary/[0.07] cursor-pointer' : 'hover:bg-muted/30'
              }`}
              onClick={() => {
                if (isFreePreview) {
                  handleOpenPreview(lesson);
                }
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
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                        <Sparkles className="w-3 h-3" /> Free Preview (4:30)
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

              {/* Action column */}
              <div className="shrink-0">
                {isFreePreview ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenPreview(lesson);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-primary text-primary-foreground text-xs font-bold hover:bg-brand-primary-hover shadow-sm transition-all"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Watch Preview
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
          );
        })}
      </div>

      {/* Free Preview Video Modal - Tight 16:9 Video Frame Only, Absolutely Zero Extra Space */}
      {activePreviewLesson && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={handleCloseModal}
        >
          {/* Exact 16:9 Video Box - No excess padding, no tall containers */}
          <div 
            className="relative w-full max-w-3xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/15 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* The Underlying Embed (controls=0 & disablekb=1 prevents user from fast-forwarding or scrubbing) */}
            {cleanYtId ? (
              <iframe
                ref={iframeRef}
                key={iframeKey}
                src={`https://www.youtube-nocookie.com/embed/${cleanYtId}?autoplay=1&enablejsapi=1&controls=0&disablekb=1&modestbranding=1&rel=0&start=0&end=${PREVIEW_LIMIT_SECONDS}`}
                title={activePreviewLesson.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0 pointer-events-auto"
              />
            ) : activePreviewLesson.vimeo_video_id ? (
              <iframe
                key={iframeKey}
                src={`https://player.vimeo.com/video/${activePreviewLesson.vimeo_video_id}?autoplay=1&controls=0`}
                title={activePreviewLesson.title}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                Preview video is loading or being processed...
              </div>
            )}

            {/* Floating Top Bar (Overlay directly on top of video, zero extra space) */}
            {!isPaywallTriggered && (
              <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-2.5 sm:p-3 bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-none">
                <div className="flex items-center gap-2 pointer-events-auto">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-emerald-500 text-white px-2 py-0.5 rounded-full shadow-sm">
                    Free Preview
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-white truncate max-w-[140px] sm:max-w-xs drop-shadow-md">
                    {activePreviewLesson.title}
                  </span>
                </div>

                <div className="flex items-center gap-2 pointer-events-auto">
                  {/* Countdown pill */}
                  <span className="text-[11px] sm:text-xs font-mono font-bold text-amber-300 bg-black/60 px-2 py-0.5 rounded-md border border-white/10 backdrop-blur-md">
                    {formatMinutesSeconds(elapsedSeconds)} / 4:30
                  </span>
                  {/* Close X */}
                  <button 
                    onClick={handleCloseModal}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/20 transition-all backdrop-blur-md"
                    title="Close preview"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Floating Bottom Mini Controls (Play/Pause & Quick Enroll, zero fast-forwarding) */}
            {!isPaywallTriggered && (
              <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-2 sm:p-3 flex items-center justify-between gap-3 pointer-events-auto">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTogglePlay}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-md transition-colors"
                    title={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? (
                      <Pause className="w-3.5 h-3.5 fill-current" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    )}
                  </button>
                  <span className="text-[10px] sm:text-xs text-slate-300 font-medium hidden sm:inline">
                    {isPlaying ? "Watching Preview" : "Paused"}
                  </span>
                </div>

                {/* Direct quick enroll pill */}
                <button
                  onClick={handleEnrollNow}
                  disabled={isEnrolling}
                  className="px-3 py-1.5 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white text-[11px] sm:text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                >
                  {isEnrolling ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <>
                      <span>Enroll Full Course ({formatPrice(product.price, product.currency)})</span>
                      <ArrowRight className="w-3 h-3" />
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Slim Progress Bar at the very bottom */}
            {!isPaywallTriggered && (
              <div className="absolute bottom-0 left-0 right-0 z-30 h-1 bg-white/20">
                <div 
                  className="h-full bg-brand-primary transition-all duration-300"
                  style={{ width: `${Math.min(100, (elapsedSeconds / PREVIEW_LIMIT_SECONDS) * 100)}%` }}
                />
              </div>
            )}

            {/* Paywall Overlay - Fits EXACTLY inside the 16:9 Video Frame */}
            {isPaywallTriggered && (
              <div className="absolute inset-0 z-40 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6 text-center animate-in fade-in duration-300 overflow-y-auto">
                {/* Close X */}
                <button 
                  onClick={handleCloseModal}
                  className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Badge */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] sm:text-xs font-bold tracking-wider uppercase mb-1.5">
                  <Lock className="w-3 h-3" />
                  <span>Free Preview Ended • 4m 30s</span>
                </div>

                {/* Headline */}
                <h3 className="text-sm sm:text-xl md:text-2xl font-heading font-extrabold text-white mb-1 leading-tight max-w-md">
                  Unlock the Full Course Access
                </h3>

                {/* Subtitle */}
                <p className="text-[11px] sm:text-xs text-slate-300 max-w-sm mb-2 sm:mb-3 leading-relaxed hidden sm:block">
                  You’ve completed the 4:30 preview! Enroll now to unlock all {lessons.length} lessons, verified certificate, and lifetime updates.
                </p>

                {/* Action Buttons */}
                <div className="w-full max-w-xs sm:max-w-sm space-y-1.5 sm:space-y-2">
                  <button
                    onClick={handleEnrollNow}
                    disabled={isEnrolling}
                    className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-white font-bold text-xs sm:text-sm shadow-lg shadow-brand-primary/25 flex items-center justify-center gap-1.5 transition-all"
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
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>

                  <a
                    href="https://chat.whatsapp.com/JGZhpVPwZnr9WViOzkMFHy?s=cl&p=a&iam=2"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-1.5 sm:py-2 px-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold text-[10px] sm:text-xs flex items-center justify-center gap-1.5 transition-colors text-center"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                    Prefer Bank Transfer? Chat on WhatsApp
                  </a>

                  <div className="flex items-center justify-center gap-3 pt-0.5">
                    <button
                      onClick={handleReplayPreview}
                      className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Replay 4:30 Preview
                    </button>
                    <span className="text-slate-600">•</span>
                    <span className="text-[10px] sm:text-[11px] text-slate-400">
                      30-Day Guarantee
                    </span>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}
