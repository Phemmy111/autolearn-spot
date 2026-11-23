"use client";

import React, { useState } from 'react';
import { PlayCircle, Clock, Lock, Play, X, Sparkles, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

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

export default function CurriculumWithPreview({
  lessons,
  product,
  isEnrolled = false,
}: {
  lessons: Lesson[];
  product: Product;
  isEnrolled?: boolean;
}) {
  const [activePreviewLesson, setActivePreviewLesson] = useState<Lesson | null>(null);

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency || 'NGN',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!lessons || lessons.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-8 text-center">
        <p className="text-muted-foreground">Curriculum details are being updated by the author.</p>
      </div>
    );
  }

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
                  setActivePreviewLesson(lesson);
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
                        <Sparkles className="w-3 h-3" /> Free Preview
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
                      setActivePreviewLesson(lesson);
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

      {/* Free Preview Video Modal */}
      {activePreviewLesson && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setActivePreviewLesson(null)}
        >
          <div 
            className="relative w-full max-w-3xl bg-card border border-border rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border bg-muted/40">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-0.5 rounded-full">
                  Free Preview
                </span>
                <h3 className="font-bold text-sm sm:text-base text-foreground line-clamp-1">
                  {activePreviewLesson.title}
                </h3>
              </div>
              <button 
                onClick={() => setActivePreviewLesson(null)}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player Frame */}
            <div className="relative w-full aspect-video bg-black">
              {activePreviewLesson.youtube_video_id ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${activePreviewLesson.youtube_video_id}?autoplay=1&modestbranding=1&rel=0`}
                  title={activePreviewLesson.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full border-0"
                />
              ) : activePreviewLesson.vimeo_video_id ? (
                <iframe
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
            <div className="p-5 sm:p-6 bg-gradient-to-r from-brand-primary/10 via-muted/50 to-transparent flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-foreground text-sm sm:text-base flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-brand-primary" />
                  Ready to master this complete skill?
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Get full lifetime access to all lessons, templates, community & verified certificate.
                </p>
              </div>

              <Link
                href="/cart"
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-brand-primary text-primary-foreground font-bold text-xs sm:text-sm hover:bg-brand-primary-hover shadow-lg shadow-brand-primary/20 transition-all text-center whitespace-nowrap"
              >
                Enroll Now • {formatPrice(product.price, product.currency)}
              </Link>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
