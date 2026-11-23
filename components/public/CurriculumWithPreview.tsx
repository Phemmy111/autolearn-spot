"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  PlayCircle, 
  Clock, 
  Lock, 
  Play, 
  X, 
  Sparkles, 
  MessageCircle, 
  ArrowRight, 
  Loader2, 
  RotateCcw,
  ChevronDown,
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
  const maxWatchedTimeRef = useRef(0);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency || 'NGN',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Toggle inline preview for a lesson
  const handleTogglePreview = (lesson: Lesson) => {
    if (expandedPreviewId === lesson.id) {
      setExpandedPreviewId(null);
      setIsPaywallTriggered(false);
    } else {
      setExpandedPreviewId(lesson.id);
      setIsPaywallTriggered(false);
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
    maxWatchedTimeRef.current = 0;
    setIframeKey((prev) => prev + 1);
  };

  // YouTube Iframe listener + 4:30 Cutoff & anti-forwarding guard
  useEffect(() => {
    if (!expandedPreviewId) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        if (!event.data) return;
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

        // When YouTube reaches the end parameter (end=270, code 0) after having played
        if (data?.event === 'onStateChange' && data.info === 0 && maxWatchedTimeRef.current >= 250) {
          setIsPaywallTriggered(true);
        }

        // Real-time tracking of current playback time
        if (data?.event === 'infoDelivery' && data?.info?.currentTime !== undefined) {
          const current = data.info.currentTime;
          maxWatchedTimeRef.current = Math.max(maxWatchedTimeRef.current, current);
          if (current >= PREVIEW_LIMIT_SECONDS) {
            setIsPaywallTriggered(true);
          }
        }
      } catch {}
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
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

            {/* INLINE PREVIEW PLAYER: The Video Frame Alone, No Extra Space, No Broken Modal */}
            {isExpanded && isFreePreview && (
              <div className="px-4 pb-6 sm:px-6 animate-in fade-in duration-300">
                {/* 16:9 Video Box with zero dead space */}
                <div className="relative w-full aspect-video rounded-xl sm:rounded-2xl overflow-hidden bg-black border border-border shadow-2xl">
                  {/* Floating Top Controls inside video */}
                  <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/90 text-white text-[10px] sm:text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-md">
                      <Sparkles className="w-3 h-3" /> Free Preview • 4:30 Limit
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
                      key={iframeKey}
                      src={`https://www.youtube.com/embed/${cleanYtId}?enablejsapi=1&playsinline=1&end=${PREVIEW_LIMIT_SECONDS}&rel=0&origin=${typeof window !== 'undefined' ? window.location.origin : ''}`}
                      title={lesson.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full border-0"
                    />
                  ) : lesson.vimeo_video_id ? (
                    <iframe
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
