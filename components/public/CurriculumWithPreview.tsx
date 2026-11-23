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
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [iframeKey, setIframeKey] = useState(1);
  const maxWatchedTimeRef = useRef(0);

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency || 'NGN',
      maximumFractionDigits: 0,
    }).format(amount);
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

  // Open preview
  const handleOpenPreview = (lesson: Lesson) => {
    setActivePreviewLesson(lesson);
    setIsPaywallTriggered(false);
    maxWatchedTimeRef.current = 0;
    setIframeKey((prev) => prev + 1);
  };

  const handleCloseModal = () => {
    setActivePreviewLesson(null);
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
    if (!activePreviewLesson) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        if (!event.data) return;
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

        // When YouTube reaches the end parameter (end=270, code 0)
        if (data?.event === 'onStateChange' && data.info === 0) {
          setIsPaywallTriggered(true);
        }

        // Real-time tracking
        if (data?.event === 'infoDelivery' && data?.info?.currentTime !== undefined) {
          const current = data.info.currentTime;
          if (current >= PREVIEW_LIMIT_SECONDS) {
            setIsPaywallTriggered(true);
          }
        }
      } catch {}
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [activePreviewLesson]);

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

      {/* Free Preview Video Modal - THE VIDEO FRAME ALONE, NO EXTRA SPACE */}
      {activePreviewLesson && (
        <div 
          className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={handleCloseModal}
        >
          {/* Exact 16:9 Video Box - Absolutely no excess height, no tall containers */}
          <div 
            className="relative w-full max-w-3xl aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black border border-white/15"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button floating at top-right corner of video */}
            <button
              onClick={handleCloseModal}
              className="absolute top-2.5 right-2.5 z-30 w-8 h-8 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center border border-white/20 transition-all shadow-lg backdrop-blur-sm"
              title="Close preview"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Free Preview Badge floating at top-left corner of video */}
            <div className="absolute top-2.5 left-2.5 z-30 flex items-center gap-2 pointer-events-none">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-emerald-500 text-white px-2.5 py-1 rounded-full shadow-md backdrop-blur-sm">
                Free Preview (4:30)
              </span>
            </div>

            {/* Paywall Overlay when 4:30 limit is reached */}
            {isPaywallTriggered ? (
              <div className="absolute inset-0 z-40 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 text-center animate-in fade-in duration-200 overflow-y-auto">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] sm:text-xs font-bold uppercase mb-2">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Free Preview Ended • 4m 30s</span>
                </div>

                <h3 className="text-base sm:text-xl font-heading font-extrabold text-white mb-1.5 leading-tight">
                  Unlock the Full Course Access
                </h3>

                <p className="text-[11px] sm:text-xs text-slate-300 max-w-sm mb-4 leading-relaxed">
                  You’ve completed the 4:30 preview! Enroll now to unlock all {lessons.length} lessons, verified certificate, and lifetime updates.
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
                    Prefer Bank Transfer? Chat with Admin
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
            ) : cleanYtId ? (
              /* Embedded YouTube Player: ends strictly at 270s (4:30) */
              <iframe
                key={iframeKey}
                src={`https://www.youtube.com/embed/${cleanYtId}?autoplay=1&enablejsapi=1&start=0&end=${PREVIEW_LIMIT_SECONDS}&rel=0`}
                title={activePreviewLesson.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full border-0"
              />
            ) : activePreviewLesson.vimeo_video_id ? (
              <iframe
                key={iframeKey}
                src={`https://player.vimeo.com/video/${activePreviewLesson.vimeo_video_id}?autoplay=1`}
                title={activePreviewLesson.title}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                Preview video is loading...
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
