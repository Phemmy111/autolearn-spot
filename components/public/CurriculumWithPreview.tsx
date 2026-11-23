"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  PlayCircle, 
  Clock, 
  Lock, 
  Play, 
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [iframeKey, setIframeKey] = useState(1);
  const playerRef = useRef<any>(null);

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

  // Lock body scroll when preview modal is active to eliminate background movement and bleed
  useEffect(() => {
    if (activePreviewLesson) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [activePreviewLesson]);

  // Reset state when opening a new preview lesson
  const handleOpenPreview = (lesson: Lesson) => {
    setActivePreviewLesson(lesson);
    setIsPaywallTriggered(false);
    setElapsedSeconds(0);
    setIsPlaying(true);
    setIframeKey((prev) => prev + 1);
  };

  const handleCloseModal = () => {
    setActivePreviewLesson(null);
    setIsPaywallTriggered(false);
    setElapsedSeconds(0);
    setIsPlaying(false);
    if (playerRef.current && typeof playerRef.current.destroy === 'function') {
      try {
        playerRef.current.destroy();
      } catch {}
      playerRef.current = null;
    }
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
    setIsPlaying(true);
    setIframeKey((prev) => prev + 1);
  };

  // 1. YouTube Iframe API + postMessage listener
  useEffect(() => {
    if (!activePreviewLesson) return;

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

        // Info delivery with current time
        if (data?.event === 'infoDelivery' && data?.info?.currentTime !== undefined) {
          const current = Math.floor(data.info.currentTime);
          setElapsedSeconds(current);
          if (current >= PREVIEW_LIMIT_SECONDS) {
            setIsPaywallTriggered(true);
          }
        }
      } catch {}
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [activePreviewLesson]);

  // 2. Playback ticker: advances when video is playing until 270s (4:30)
  useEffect(() => {
    if (!activePreviewLesson || isPaywallTriggered || !isPlaying) return;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        if (next >= PREVIEW_LIMIT_SECONDS) {
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

      {/* Free Preview Video Modal with 4m 30s Cutoff */}
      {activePreviewLesson && (
        <div 
          className="fixed inset-0 z-[9999] flex flex-col justify-between sm:justify-center sm:items-center p-0 sm:p-4 bg-black/95 sm:bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={handleCloseModal}
        >
          <div 
            className="relative w-full h-full sm:h-auto sm:max-w-3xl bg-slate-950 sm:bg-card border-0 sm:border border-border rounded-none sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between sm:justify-start animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Bar */}
            <div className="shrink-0 flex items-center justify-between p-3 sm:p-4 border-b border-slate-800 sm:border-border bg-slate-900/90 sm:bg-muted/40 backdrop-blur-md">
              <div className="flex items-center gap-2 overflow-hidden mr-2">
                <span className="shrink-0 text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-0.5 rounded-full">
                  Free Preview
                </span>
                <h3 className="font-bold text-xs sm:text-sm text-white sm:text-foreground truncate">
                  {activePreviewLesson.title}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                  <span className={`inline-block w-2 h-2 rounded-full ${isPaywallTriggered ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
                  {isPaywallTriggered ? '4:30 Reached' : `${formatMinutesSeconds(elapsedSeconds)} / 4:30`}
                </span>
                <button 
                  onClick={handleCloseModal}
                  className="shrink-0 p-1.5 rounded-full text-slate-400 hover:text-white sm:text-muted-foreground sm:hover:text-foreground hover:bg-slate-800 sm:hover:bg-muted transition-colors"
                  title="Close preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Mobile Timer Bar (compact) */}
            <div className="shrink-0 bg-slate-950 px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-xs sm:hidden">
              <div className="flex items-center gap-1.5">
                <span className={`inline-block w-2 h-2 rounded-full ${isPaywallTriggered ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
                <span className="font-medium text-slate-300 text-[11px]">
                  {isPaywallTriggered ? (
                    <strong className="text-amber-400">Preview limit reached (4:30)</strong>
                  ) : (
                    <>
                      Timer: <strong className="text-white font-mono">{formatMinutesSeconds(elapsedSeconds)}</strong> / <span className="text-slate-400 font-mono">4:30</span>
                    </>
                  )}
                </span>
              </div>
              <button
                onClick={handleEnrollNow}
                disabled={isEnrolling}
                className="text-[11px] font-bold text-brand-primary hover:text-brand-primary-hover flex items-center gap-1"
              >
                Enroll ({formatPrice(product.price, product.currency)})
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            
            {/* Progress Bar */}
            <div className="shrink-0 w-full bg-slate-900 h-1">
              <div 
                className={`h-1 transition-all duration-300 ${isPaywallTriggered ? 'bg-amber-400' : 'bg-brand-primary'}`}
                style={{ width: `${Math.min(100, (elapsedSeconds / PREVIEW_LIMIT_SECONDS) * 100)}%` }}
              />
            </div>

            {/* Video Player Frame with 4:30 Cutoff & Paywall Overlay */}
            <div className="relative w-full aspect-video bg-black overflow-hidden my-auto sm:my-0">
              {/* If Paywall is Triggered, show the High-Converting Paywall Overlay */}
              {isPaywallTriggered ? (
                <div className="absolute inset-0 z-30 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 text-center animate-in fade-in duration-300">
                  {/* Badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold tracking-wider uppercase mb-2 sm:mb-3">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Free Preview Ended • 4m 30s</span>
                  </div>

                  {/* Headline */}
                  <h3 className="text-lg sm:text-2xl md:text-3xl font-heading font-extrabold text-white mb-2 leading-tight max-w-lg">
                    Unlock the Full Lesson & Complete Course
                  </h3>

                  {/* Subtitle */}
                  <p className="text-xs sm:text-sm text-slate-300 max-w-md mb-4 sm:mb-5 leading-relaxed">
                    You’ve experienced the quality of our hands-on lessons! Enroll now to unlock all <strong className="text-white">{lessons.length} lessons</strong>, code workflows, instructor Q&A, and your verified certificate.
                  </p>

                  {/* Value Checklist */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-2.5 max-w-sm sm:max-w-md w-full mb-4 sm:mb-5 text-left">
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>All {lessons.length} HD Lessons</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Verified Certificate</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Lifetime Access</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Instructor Support</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="w-full max-w-sm sm:max-w-md space-y-2.5">
                    <button
                      onClick={handleEnrollNow}
                      disabled={isEnrolling}
                      className="group w-full py-3 sm:py-3.5 px-6 rounded-2xl bg-brand-primary hover:bg-brand-primary-hover text-white font-bold text-sm sm:text-base shadow-xl shadow-brand-primary/25 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-75"
                    >
                      {isEnrolling ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Opening Checkout...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 text-amber-300 fill-amber-300" />
                          <span>Enroll Now • {formatPrice(product.price, product.currency)}</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>

                    <a
                      href="https://chat.whatsapp.com/JGZhpVPwZnr9WViOzkMFHy?s=cl&p=a&iam=2"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold text-xs flex items-center justify-center gap-2 transition-colors text-center"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      Prefer Direct Bank Transfer? Chat on WhatsApp
                    </a>

                    <div className="flex items-center justify-center gap-4 pt-0.5">
                      <button
                        onClick={handleReplayPreview}
                        className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Replay 4:30 Preview
                      </button>
                      <span className="text-slate-600">•</span>
                      <span className="text-[11px] text-slate-400">
                        30-Day Money-Back Guarantee
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* The Underlying Embed (starts at 0 and automatically cuts off at 270s) */}
              {cleanYtId ? (
                <iframe
                  key={iframeKey}
                  src={`https://www.youtube-nocookie.com/embed/${cleanYtId}?autoplay=1&enablejsapi=1&start=0&end=${PREVIEW_LIMIT_SECONDS}&modestbranding=1&rel=0`}
                  title={activePreviewLesson.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full border-0"
                />
              ) : activePreviewLesson.vimeo_video_id ? (
                <iframe
                  key={iframeKey}
                  src={`https://player.vimeo.com/video/${activePreviewLesson.vimeo_video_id}?autoplay=1`}
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
            </div>

            {/* Modal Footer / Upsell Banner */}
            <div className="shrink-0 p-3 sm:p-4 bg-slate-900/90 sm:bg-muted/40 border-t border-slate-800 sm:border-border flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="w-full sm:w-auto text-center sm:text-left">
                <h4 className="font-bold text-white sm:text-foreground text-xs sm:text-sm flex items-center justify-center sm:justify-start gap-1.5">
                  <Sparkles className="w-4 h-4 text-brand-primary" />
                  Ready to master this complete skill?
                </h4>
                <p className="text-[11px] sm:text-xs text-slate-400 sm:text-muted-foreground mt-0.5 line-clamp-1">
                  Get full lifetime access to all lessons, templates, community & certificate.
                </p>
              </div>

              <div className="w-full sm:w-auto flex items-center gap-2">
                <a
                  href="https://chat.whatsapp.com/JGZhpVPwZnr9WViOzkMFHy?s=cl&p=a&iam=2"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sm:hidden px-3.5 py-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-semibold text-xs flex items-center justify-center gap-1 shrink-0"
                  title="Chat on WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>

                <button
                  onClick={handleEnrollNow}
                  disabled={isEnrolling}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-brand-primary text-primary-foreground font-bold text-xs sm:text-sm hover:bg-brand-primary-hover shadow-lg shadow-brand-primary/20 transition-all text-center whitespace-nowrap flex items-center justify-center gap-1.5"
                >
                  {isEnrolling ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Enroll Now • {formatPrice(product.price, product.currency)}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
