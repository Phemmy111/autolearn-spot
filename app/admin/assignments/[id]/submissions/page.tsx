"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';

interface Submission {
  id: string;
  assignment_id: string;
  user_id: string;
  student_name?: string | null;
  student_email?: string | null;
  live_url: string;
  screenshot_url: string | null;
  notes: string | null;
  status: 'submitted' | 'approved' | 'needs_revision';
  ai_score: number | null;
  ai_feedback: string | null;
  created_at: string;
  updated_at: string;
  assignment: {
    id: string;
    title: string;
    week_number: number;
    max_score: number;
  };
}

export default function AssignmentSubmissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewingSubmission, setReviewingSubmission] = useState<Submission | null>(null);
  const [reviewData, setReviewData] = useState({
    score: 0,
    feedback: '',
    status: 'approved' as 'approved' | 'needs_revision',
  });
  const [submitting, setSubmitting] = useState(false);
  const [assignmentId, setAssignmentId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const resolvedParams = await params;
      setAssignmentId(resolvedParams.id);
      fetchSubmissions(resolvedParams.id);
    };
    init();
  }, []);

  const fetchSubmissions = async (id: string) => {
    try {
      console.log('Fetching submissions for assignment:', id);
      const res = await fetch(`/api/admin/assignments/${id}/submissions`);
      console.log('Response status:', res.status);
      const data = await res.json();
      console.log('Response data:', data);
      if (!res.ok) throw new Error(data.error || 'Failed to fetch submissions');
      setSubmissions(data.submissions || []);
    } catch (err: any) {
      console.error('Error fetching submissions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingSubmission) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/submissions/${reviewingSubmission.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData),
      });

      if (!res.ok) throw new Error('Failed to update submission');

      setReviewingSubmission(null);
      setReviewData({ score: 0, feedback: '', status: 'approved' });
      if (assignmentId) fetchSubmissions(assignmentId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openReviewModal = (submission: Submission) => {
    setReviewingSubmission(submission);
    setReviewData({
      score: submission.ai_score || 0,
      feedback: submission.ai_feedback || '',
      status: submission.status === 'needs_revision' ? 'needs_revision' : 'approved',
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <span className="px-2 py-1 text-xs font-mono uppercase bg-[bg-[var(--card)]] text-[text-[var(--text-muted)]] border border-[border-[var(--border-default)]]">Submitted</span>;
      case 'approved':
        return <span className="px-2 py-1 text-xs font-mono uppercase bg-[#0f4c3c] text-[text-[var(--primary)]] border border-[text-[var(--primary)]]">Approved</span>;
      case 'needs_revision':
        return <span className="px-2 py-1 text-xs font-mono uppercase bg-[#4c1a1a] text-[#ff6b6b] border border-[#ff6b6b]">Needs Revision</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[bg-[var(--card)]] text-[text-[var(--text-primary)]] flex items-center justify-center">
        <div className="font-mono text-sm text-[text-[var(--text-muted)]]">Loading submissions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[bg-[var(--card)]] text-[text-[var(--text-primary)]] flex items-center justify-center">
        <div className="font-mono text-sm text-[#ff6b6b]">Error: {error}</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[bg-[var(--card)]] text-[text-[var(--text-primary)]]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-[border-[var(--border-default)]] bg-[bg-[var(--card)]]/95 px-4 backdrop-blur sm:px-6">
        <Link className="flex items-center gap-2 font-mono text-sm font-bold uppercase text-[var(--text-primary)]" href="/admin/assignments">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-[text-[var(--primary)]]">//</span>
          <span className="underline decoration-[text-[var(--text-muted)]] decoration-2 underline-offset-2">Assignments</span>
        </Link>
        <div className="font-mono text-xs uppercase text-[text-[var(--text-muted)]]">
          Submissions
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="mb-8 font-heading text-3xl font-bold uppercase text-[var(--text-primary)]">Submissions</h1>

        {submissions.length === 0 ? (
          <div className="border border-[border-[var(--border-default)]] bg-[bg-[var(--card)]] p-8 text-center">
            <p className="font-mono text-sm text-[text-[var(--text-muted)]]">No submissions yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="border border-[border-[var(--border-default)]] bg-[bg-[var(--card)]] p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <span className="font-mono text-xs uppercase text-[text-[var(--primary)]]">
                        Week {submission.assignment.week_number}
                      </span>
                      {getStatusBadge(submission.status)}
                    </div>
                    <h2 className="mb-2 font-heading text-xl font-bold text-[var(--text-primary)]">
                      {submission.assignment.title}
                    </h2>
                    <div className="mb-4 font-mono text-sm text-[text-[var(--text-muted)]] space-y-1">
                      {submission.student_name && <div><span>Name: {submission.student_name}</span></div>}
                      {submission.student_email && <div><span>Email: {submission.student_email}</span></div>}
                      <div className="text-xs text-[#6b7b7c]">ID: {submission.user_id}</div>
                    </div>
                    {submission.screenshot_url && (
                      <div className="mb-4">
                        <p className="font-mono text-xs uppercase text-[text-[var(--text-muted)]] mb-2">Screenshot:</p>
                        <a
                          href={submission.screenshot_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block group"
                        >
                          <img
                            src={submission.screenshot_url}
                            alt="Submission screenshot"
                            className="max-h-32 rounded border border-[border-[var(--border-default)]] group-hover:border-[text-[var(--primary)]] transition-colors"
                          />
                          <span className="block mt-1 font-mono text-xs text-[text-[var(--text-muted)]] group-hover:text-[text-[var(--primary)]] transition-colors">Click to open full image ↗</span>
                        </a>
                      </div>
                    )}
                    {submission.notes && (
                      <div className="mb-4 border-t border-[border-[var(--border-default)]] pt-4">
                        <p className="font-mono text-xs uppercase text-[text-[var(--text-muted)]] mb-2">Student Notes:</p>
                        <p className="font-mono text-sm text-[text-[var(--text-primary)]]">{submission.notes}</p>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-4 text-xs font-mono text-[text-[var(--text-muted)]]">
                      <div>
                        <span>Submitted: {formatDate(submission.created_at)}</span>
                      </div>
                      {submission.ai_score !== null && (
                        <div>
                          <span>Score: <span className="text-[text-[var(--primary)]]">{submission.ai_score}</span>/{submission.assignment.max_score}</span>
                        </div>
                      )}
                    </div>
                    {submission.ai_feedback && (
                      <div className="mt-4 border-t border-[border-[var(--border-default)]] pt-4">
                        <p className="font-mono text-xs uppercase text-[text-[var(--text-muted)]] mb-2">Feedback:</p>
                        <p className="font-mono text-sm text-[text-[var(--text-primary)]]">{submission.ai_feedback}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 sm:min-w-[200px]">
                    {submission.live_url && (
                    <a
                      href={submission.live_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 border border-[var(--border-default)] bg-[var(--card)] px-4 py-2 font-mono text-xs uppercase text-[var(--text-muted)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open Link
                    </a>
                    )}
                    <button
                      onClick={() => openReviewModal(submission)}
                      className="flex items-center justify-center gap-2 border border-[var(--primary)] bg-[var(--primary)] px-4 py-2 font-mono text-xs uppercase font-bold text-white transition hover:bg-[var(--primary-hover)]"
                    >
                      Review
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-xl border border-[var(--border-default)] bg-[var(--card)] p-8 shadow-lg">
            <h2 className="mb-4 font-heading text-2xl font-bold text-[var(--text-primary)]">
              Review Submission
            </h2>
            <p className="mb-6 font-mono text-sm text-[var(--text-muted)]">
              {reviewingSubmission.assignment.title}
            </p>

            <form onSubmit={handleReview} className="space-y-4">
              <div>
                <label className="mb-2 block font-mono text-xs uppercase text-[text-[var(--text-muted)]]">
                  Score *
                </label>
                <input
                  type="number"
                  value={reviewData.score}
                  onChange={(e) => setReviewData({ ...reviewData, score: parseInt(e.target.value) })}
                  min="0"
                  max={reviewingSubmission.assignment.max_score}
                  required
                  className="w-full border border-[border-[var(--border-default)]] bg-[bg-[var(--card)]] px-4 py-3 font-mono text-sm text-[text-[var(--text-primary)]] focus:border-[text-[var(--primary)]] focus:outline-none"
                />
                <p className="mt-1 font-mono text-xs text-[text-[var(--text-muted)]]">
                  Max: {reviewingSubmission.assignment.max_score}
                </p>
              </div>

              <div>
                <label className="mb-2 block font-mono text-xs uppercase text-[text-[var(--text-muted)]]">
                  Status *
                </label>
                <select
                  value={reviewData.status}
                  onChange={(e) => setReviewData({ ...reviewData, status: e.target.value as 'approved' | 'needs_revision' })}
                  className="w-full border border-[border-[var(--border-default)]] bg-[bg-[var(--card)]] px-4 py-3 font-mono text-sm text-[text-[var(--text-primary)]] focus:border-[text-[var(--primary)]] focus:outline-none"
                >
                  <option value="approved">Approved</option>
                  <option value="needs_revision">Needs Revision</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block font-mono text-xs uppercase text-[text-[var(--text-muted)]]">
                  Feedback
                </label>
                <textarea
                  value={reviewData.feedback}
                  onChange={(e) => setReviewData({ ...reviewData, feedback: e.target.value })}
                  rows={4}
                  placeholder="Provide feedback to the student..."
                  className="w-full border border-[border-[var(--border-default)]] bg-[bg-[var(--card)]] px-4 py-3 font-mono text-sm text-[text-[var(--text-primary)]] focus:border-[text-[var(--primary)]] focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setReviewingSubmission(null);
                    setReviewData({ score: 0, feedback: '', status: 'approved' });
                  }}
                  className="font-mono text-sm text-[text-[var(--text-muted)]] hover:text-[var(--text-primary)] px-6 py-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[text-[var(--primary)]] text-black font-bold uppercase tracking-wider font-mono px-6 py-3 rounded hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Saving...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


    </main>
  );
}
