"use client";

import { useState } from 'react';
import { Star, X, CheckCircle, Sparkles, MessageSquare } from 'lucide-react';

interface CourseReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseTitle: string;
  lessonId?: string;
  lessonTitle?: string;
  onSubmitted?: () => void;
}

export default function CourseReviewModal({
  isOpen,
  onClose,
  courseId,
  courseTitle,
  lessonId,
  lessonTitle,
  onSubmitted
}: CourseReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Exceptional!'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || content.trim().length < 3) {
      setError('Please share a few words about what you learned or enjoyed.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: courseId,
          course_title: courseTitle,
          rating,
          title: title.trim(),
          content: content.trim(),
          lesson_id: lessonId,
          lesson_title: lessonTitle,
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit review');
      }

      setSubmitted(true);
      try {
        localStorage.setItem(`course_reviewed_${courseId}`, 'true');
      } catch (e) {}

      if (onSubmitted) onSubmitted();

      setTimeout(() => {
        onClose();
      }, 2200);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem(`review_prompt_dismissed_${courseId}`, Date.now().toString());
    } catch (e) {}
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 animate-bounce">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h3>
            <p className="text-gray-600 text-sm max-w-sm">
              Your review for <span className="font-semibold text-gray-900">{courseTitle}</span> has been published. Your feedback inspires both instructors and fellow students!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                Lesson Milestone
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                How&apos;s your learning experience?
              </h2>
              <p className="text-gray-500 text-xs sm:text-sm mt-1">
                You just completed <span className="font-semibold text-gray-700">{lessonTitle || 'a lesson'}</span>. Help others discover this course!
              </p>
            </div>

            {/* Star Rating Selector */}
            <div className="bg-gray-50/80 border border-gray-100 rounded-2xl p-4 text-center">
              <p className="text-xs font-medium text-gray-500 mb-2">Select your rating</p>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = (hoverRating || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform hover:scale-110 focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          active
                            ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                            : 'text-gray-200 fill-gray-100'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <p className="text-xs font-bold text-emerald-600 mt-2 h-4">
                {ratingLabels[hoverRating || rating]}
              </p>
            </div>

            {/* Review Title */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Headline / Quick summary (optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Great clear explanations, very practical!"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all placeholder:text-gray-400"
              />
            </div>

            {/* Review Content */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Your Review <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="What did you like about this lesson or course? How has it helped you?"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all placeholder:text-gray-400 resize-none"
              />
            </div>

            {error && (
              <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                {error}
              </p>
            )}

            {/* Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleDismiss}
                className="px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Maybe Later
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all text-sm flex items-center justify-center gap-2"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
