"use client";

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, CheckCircle2, ThumbsUp, ArrowRight, Quote, PlusCircle } from 'lucide-react';
import { studentTestimonials } from '@/config/testimonials';
import CourseReviewModal from '@/components/CourseReviewModal';

interface CourseStudentReviewsProps {
  courseId?: string;
  courseTitle?: string;
  courseSlug?: string;
}

interface LiveReview {
  id: string;
  course_id: string;
  student_name: string;
  student_avatar?: string;
  rating: number;
  title?: string;
  content: string;
  created_at: string;
  status: string;
}

export function CourseStudentReviews({ courseId, courseTitle, courseSlug }: CourseStudentReviewsProps) {
  const [liveReviews, setLiveReviews] = useState<LiveReview[]>([]);
  const [showModal, setShowModal] = useState(false);

  const fetchLiveReviews = useCallback(async () => {
    try {
      const url = courseId ? `/api/reviews?courseId=${encodeURIComponent(courseId)}` : '/api/reviews';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.reviews)) {
          setLiveReviews(data.reviews);
        }
      }
    } catch (e) {
      console.warn('Could not load live reviews:', e);
    }
  }, [courseId]);

  useEffect(() => {
    fetchLiveReviews();
  }, [fetchLiveReviews]);

  // Find static fallback testimonials matching this course
  const staticReviews = studentTestimonials.filter(r => {
    if (!r.course || !courseTitle) return true;
    const normR = r.course.toLowerCase();
    const normC = courseTitle.toLowerCase();
    return normR.includes(normC) || normC.includes(normR) || normC.includes('automation');
  });

  // Convert live reviews to unified display shape
  const formattedLiveReviews = liveReviews.map(r => ({
    id: r.id,
    name: r.student_name,
    school: 'Verified AutoLearn Student',
    rating: r.rating,
    testimonial: r.content,
    headline: r.title,
    image: r.student_avatar || null,
    verified: true,
    isLive: true,
    date: new Date(r.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  }));

  // Combine: live reviews first, then static testimonials
  const combinedReviews = [...formattedLiveReviews, ...staticReviews.map(s => ({
    ...s,
    isLive: false,
    headline: undefined
  }))];

  const totalReviewsCount = combinedReviews.length;
  const averageRating = totalReviewsCount > 0
    ? (combinedReviews.reduce((acc, r) => acc + r.rating, 0) / totalReviewsCount).toFixed(1)
    : '5.0';

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-700 fill-mode-both space-y-6">
      {/* Header & Social Proof Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h2 className="text-2xl font-heading font-bold flex items-center gap-2 text-foreground">
            <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
            What Our Students Say
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Real feedback and reviews from students enrolled in this course
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 bg-muted/40 border border-border/80 px-4 py-2.5 rounded-2xl">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <span className="font-bold text-foreground text-sm">{averageRating}</span>
            <span className="text-xs text-muted-foreground">({totalReviewsCount} reviews)</span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full ml-1">
              <ThumbsUp className="w-3 h-3" /> 100%
            </span>
          </div>

          {courseId && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-brand-primary text-white text-xs font-bold rounded-2xl hover:bg-brand-primary/90 transition-all shadow-sm shadow-brand-primary/20"
            >
              <PlusCircle className="w-4 h-4" />
              Write Review
            </button>
          )}
        </div>
      </div>

      {/* Reviews Grid */}
      {totalReviewsCount === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <Star className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
          <h4 className="text-lg font-bold text-foreground mb-1">No reviews yet</h4>
          <p className="text-muted-foreground text-sm">Be the first to review this course!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {combinedReviews.map((review, idx) => (
            <div
              key={review.id || idx}
              className={`bg-card border ${review.isLive ? 'border-emerald-500/30 ring-1 ring-emerald-500/10' : 'border-border/90'} hover:border-emerald-500/40 rounded-2xl p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between shadow-sm relative overflow-hidden group`}
            >
              <div>
                {/* Student Header */}
                <div className="flex items-start gap-3.5 mb-3.5">
                  <div className="relative shrink-0">
                    {review.image ? (
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-500/30">
                        <Image
                          src={review.image}
                          alt={review.name}
                          width={48}
                          height={48}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center font-bold text-emerald-500 text-sm">
                        {review.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                    )}
                    {review.verified && (
                      <div className="absolute -bottom-0.5 -right-0.5 bg-background rounded-full p-0.5 shadow-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500 text-background" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-bold text-foreground text-sm sm:text-base truncate">
                        {review.name}
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{review.school}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < review.rating
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-muted-foreground/30'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] font-medium text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        {review.isLive ? 'Live Student Review' : 'Verified Student'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Optional Headline */}
                {review.headline && (
                  <p className="text-sm font-bold text-foreground mb-1">
                    {review.headline}
                  </p>
                )}

                {/* Quote */}
                <div className="relative pl-1">
                  <Quote className="w-4 h-4 text-muted-foreground/20 absolute -top-1 -left-2 rotate-180" />
                  <p className="text-sm text-foreground/90 leading-relaxed font-normal">
                    &ldquo;{review.testimonial}&rdquo;
                  </p>
                </div>
              </div>

              {/* Footer / Date */}
              {review.date && (
                <div className="mt-4 pt-3 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
                  <span>{review.date}</span>
                  <span className="text-emerald-500 font-medium">Verified Learner</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Footer link to testimonials */}
      <div className="text-center pt-2">
        <Link
          href="/testimonials"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-primary hover:text-brand-primary/80 transition-colors group"
        >
          <span>View all student testimonials & capstone workflow video</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Review Modal */}
      {showModal && courseId && (
        <CourseReviewModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          courseId={courseId}
          courseTitle={courseTitle || 'Course'}
          onSubmitted={fetchLiveReviews}
        />
      )}
    </div>
  );
}
