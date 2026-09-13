import { Star, MessageSquare } from 'lucide-react';

export default function AuthorReviewsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-brand-text mb-2">Reviews & Ratings</h1>
        <p className="text-brand-text/70">
          Monitor student feedback and course ratings.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center p-16 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg text-center">
        <div className="w-16 h-16 bg-brand-bg rounded-full flex items-center justify-center mb-4">
          <Star className="w-8 h-8 text-neutral-300" />
        </div>
        <h2 className="text-xl font-semibold text-brand-text mb-2">No Reviews Yet</h2>
        <p className="text-brand-text/60 max-w-md">
          When students complete your courses and leave ratings, their feedback will appear here.
          The review system will be fully activated in a future update.
        </p>
      </div>
    </div>
  );
}
