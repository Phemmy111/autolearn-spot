"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Star, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Sparkles, 
  Search, 
  Filter, 
  Plus, 
  Loader2, 
  ThumbsUp,
  MessageSquare,
  AlertCircle
} from 'lucide-react';

interface Review {
  id: string;
  course_id: string;
  course_title?: string;
  student_id: string;
  student_name: string;
  student_email?: string;
  rating: number;
  title?: string;
  content: string;
  status: 'approved' | 'pending' | 'rejected';
  featured?: boolean;
  created_at: string;
}

interface Metrics {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  averageRating: number;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    averageRating: 5.0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Add review modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState('AI Automation with n8n');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newReviewTitle, setNewReviewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [addingReview, setAddingReview] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/reviews${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`);
      if (res.ok) {
        const json = await res.json();
        setReviews(json.reviews || []);
        if (json.metrics) setMetrics(json.metrics);
      }
    } catch (error) {
      console.error('Error fetching admin reviews:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected' | 'pending') => {
    setActionLoading(id);
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        await fetchReviews();
      }
    } catch (e) {
      console.error('Error updating review:', e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleFeatured = async (id: string, currentFeatured?: boolean) => {
    setActionLoading(id);
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, featured: !currentFeatured }),
      });
      if (res.ok) {
        await fetchReviews();
      }
    } catch (e) {
      console.error('Error toggling featured:', e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this review?')) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/reviews?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchReviews();
      }
    } catch (e) {
      console.error('Error deleting review:', e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName || !newContent) return;

    setAddingReview(true);
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: 'c1e11cc7-d8f6-4c2d-8a3b-1bb204892921',
          course_title: newCourseTitle,
          student_name: newStudentName,
          student_email: newStudentEmail,
          rating: newRating,
          title: newReviewTitle,
          content: newContent,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewStudentName('');
        setNewStudentEmail('');
        setNewReviewTitle('');
        setNewContent('');
        await fetchReviews();
      }
    } catch (err) {
      console.error('Error adding review:', err);
    } finally {
      setAddingReview(false);
    }
  };

  const filteredReviews = reviews.filter(r => {
    const q = search.toLowerCase();
    return (
      (r.student_name && r.student_name.toLowerCase().includes(q)) ||
      (r.student_email && r.student_email.toLowerCase().includes(q)) ||
      (r.course_title && r.course_title.toLowerCase().includes(q)) ||
      (r.content && r.content.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen p-6 sm:p-8 text-brand-text bg-brand-bg space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">Course Reviews & Feedback</h1>
          <p className="text-sm text-brand-text/60 mt-1">
            Moderate, feature, and oversee real live reviews submitted by students.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Test Review
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[var(--card)] border border-border/80 shadow-sm">
          <p className="text-xs font-semibold text-brand-text/60 uppercase tracking-wider mb-1">Total Reviews</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-foreground">{metrics.total}</span>
            <span className="text-xs text-brand-text/50">all courses</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--card)] border border-border/80 shadow-sm">
          <p className="text-xs font-semibold text-brand-text/60 uppercase tracking-wider mb-1">Average Rating</p>
          <div className="flex items-center gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-500">{metrics.averageRating}</span>
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${i < Math.round(metrics.averageRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--card)] border border-border/80 shadow-sm">
          <p className="text-xs font-semibold text-brand-text/60 uppercase tracking-wider mb-1">Approved & Live</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600">{metrics.approved}</span>
            <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">Active</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--card)] border border-border/80 shadow-sm">
          <p className="text-xs font-semibold text-brand-text/60 uppercase tracking-wider mb-1">Pending Moderation</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-600">{metrics.pending}</span>
            <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full">Needs review</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[var(--card)] p-4 rounded-2xl border border-border/80 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text/40" />
          <input
            type="text"
            placeholder="Search by student, course, or review text..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-brand-bg border border-border/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-foreground"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'approved', 'pending', 'rejected'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl capitalize transition-all whitespace-nowrap ${
                statusFilter === tab
                  ? 'bg-foreground text-background shadow-sm'
                  : 'text-brand-text/60 hover:text-foreground hover:bg-brand-bg'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews Table / List */}
      <div className="bg-[var(--card)] rounded-2xl border border-border/80 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center text-brand-text/50">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-2" />
            <p className="text-sm">Loading reviews...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="p-12 text-center text-brand-text/50">
            <MessageSquare className="w-12 h-12 text-brand-text/20 mx-auto mb-3" />
            <p className="text-base font-semibold text-foreground">No reviews found</p>
            <p className="text-xs mt-1">When students complete lessons and submit reviews, they will appear here in real-time.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {filteredReviews.map(review => (
              <div key={review.id} className="p-5 sm:p-6 hover:bg-muted/20 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Left: Student & Content */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm shrink-0">
                        {review.student_name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-foreground text-sm sm:text-base">{review.student_name}</h4>
                          {review.featured && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                              <Sparkles className="w-3 h-3" /> Featured
                            </span>
                          )}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            review.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                            review.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            'bg-rose-100 text-rose-700'
                          }`}>
                            {review.status}
                          </span>
                        </div>
                        <p className="text-xs text-brand-text/50">{review.student_email || 'No email provided'}</p>
                      </div>
                    </div>

                    {/* Course and Stars */}
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <span className="text-xs font-semibold px-2.5 py-1 bg-muted/60 text-foreground rounded-lg border border-border/60">
                        📚 {review.course_title || 'Course'}
                      </span>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
                          />
                        ))}
                        <span className="text-xs font-bold text-foreground ml-1">{review.rating}.0</span>
                      </div>
                      <span className="text-xs text-brand-text/40">
                        {new Date(review.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>

                    {/* Review text */}
                    <div className="pt-1">
                      {review.title && (
                        <p className="text-sm font-bold text-foreground mb-1">&quot;{review.title}&quot;</p>
                      )}
                      <p className="text-sm text-foreground/80 leading-relaxed bg-brand-bg/50 p-3 rounded-xl border border-border/50">
                        {review.content}
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 pt-2 sm:pt-0">
                    <button
                      onClick={() => handleToggleFeatured(review.id, review.featured)}
                      disabled={actionLoading === review.id}
                      className={`text-xs px-3 py-1.5 rounded-xl border font-medium flex items-center gap-1.5 transition-colors ${
                        review.featured 
                          ? 'border-amber-400 text-amber-700 bg-amber-50 hover:bg-amber-100' 
                          : 'border-border text-brand-text/60 hover:text-foreground hover:bg-brand-bg'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {review.featured ? 'Unfeature' : 'Feature'}
                    </button>

                    {review.status !== 'approved' && (
                      <button
                        onClick={() => handleUpdateStatus(review.id, 'approved')}
                        disabled={actionLoading === review.id}
                        className="text-xs px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Approve
                      </button>
                    )}

                    {review.status !== 'rejected' && (
                      <button
                        onClick={() => handleUpdateStatus(review.id, 'rejected')}
                        disabled={actionLoading === review.id}
                        className="text-xs px-3 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(review.id)}
                      disabled={actionLoading === review.id}
                      className="text-xs p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Review"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Review Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl text-gray-900 relative">
            <h3 className="text-lg font-bold mb-4">Add Course Review</h3>
            <form onSubmit={handleCreateReview} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Course Title</label>
                <input
                  type="text"
                  value={newCourseTitle}
                  onChange={e => setNewCourseTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Student Name</label>
                <input
                  type="text"
                  value={newStudentName}
                  onChange={e => setNewStudentName(e.target.value)}
                  placeholder="e.g. Segun Adeleke"
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Student Email</label>
                <input
                  type="email"
                  value={newStudentEmail}
                  onChange={e => setNewStudentEmail(e.target.value)}
                  placeholder="e.g. segun@example.com"
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Rating (1-5)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setNewRating(s)}
                      className={`p-2 rounded-lg border ${newRating >= s ? 'bg-amber-50 border-amber-400 text-amber-500' : 'border-gray-200 text-gray-300'}`}
                    >
                      <Star className="w-5 h-5 fill-current" />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Headline (optional)</label>
                <input
                  type="text"
                  value={newReviewTitle}
                  onChange={e => setNewReviewTitle(e.target.value)}
                  placeholder="e.g. Highly practical!"
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Review Content</label>
                <textarea
                  rows={3}
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  placeholder="Write the student's review..."
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                  required
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-xl text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingReview}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold"
                >
                  {addingReview ? 'Saving...' : 'Add Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
