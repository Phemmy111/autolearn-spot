"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, CheckCircle, XCircle, AlertCircle, Image as ImageIcon, ZoomIn } from 'lucide-react';

interface Submission {
  id: string;
  assignment_id: string;
  user_id: string;
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
  const [imageModal, setImageModal] = useState<string | null>(null);
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
      fetchSubmissions();
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
        return <span className="px-2 py-1 text-xs font-mono uppercase bg-[#1a1d24] text-[#b9cacb] border border-[#3b494b]">Submitted</span>;
      case 'approved':
        return <span className="px-2 py-1 text-xs font-mono uppercase bg-[#0f4c3c] text-[#00f0ff] border border-[#00f0ff]">Approved</span>;
      case 'needs_revision':
        return <span className="px-2 py-1 text-xs font-mono uppercase bg-[#4c1a1a] text-[#ff6b6b] border border-[#ff6b6b]">Needs Revision</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111317] text-[#e2e8e2] flex items-center justify-center">
        <div className="font-mono text-sm text-[#b9cacb]">Loading submissions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#111317] text-[#e2e8e2] flex items-center justify-center">
        <div className="font-mono text-sm text-[#ff6b6b]">Error: {error}</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#111317] text-[#e2e8e2]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-[#3b494b] bg-[#111317]/95 px-4 backdrop-blur sm:px-6">
        <Link className="flex items-center gap-2 font-mono text-sm font-bold uppercase text-white" href="/admin/assignments">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-[#00f0ff]">//</span>
          <span className="underline decoration-[#b9cacb] decoration-2 underline-offset-2">Assignments</span>
        </Link>
        <div className="font-mono text-xs uppercase text-[#b9cacb]">
          Submissions
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="mb-8 font-heading text-3xl font-bold uppercase text-white">Submissions</h1>

        {submissions.length === 0 ? (
          <div className="border border-[#3b494b] bg-[#1a1d24] p-8 text-center">
            <p className="font-mono text-sm text-[#b9cacb]">No submissions yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="border border-[#3b494b] bg-[#1a1d24] p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <span className="font-mono text-xs uppercase text-[#00f0ff]">
                        Week {submission.assignment.week_number}
                      </span>
                      {getStatusBadge(submission.status)}
                    </div>
                    <h2 className="mb-2 font-heading text-xl font-bold text-white">
                      {submission.assignment.title}
                    </h2>
                    <div className="mb-4 font-mono text-sm text-[#b9cacb]">
                      <span>User ID: {submission.user_id}</span>
                    </div>
                    {submission.screenshot_url && (
                      <div className="mb-4">
                        <p className="font-mono text-xs uppercase text-[#b9cacb] mb-2">Screenshot:</p>
                        <div className="relative inline-block">
                          <img
                            src={submission.screenshot_url}
                            alt="Submission screenshot"
                            className="max-h-32 rounded border border-[#3b494b] cursor-pointer hover:border-[#00f0ff] transition-colors"
                            onClick={() => setImageModal(submission.screenshot_url)}
                          />
                          <button
                            onClick={() => setImageModal(submission.screenshot_url)}
                            className="absolute bottom-2 right-2 bg-[#0c0e12] border border-[#3b494b] p-1 rounded hover:border-[#00f0ff]"
                          >
                            <ZoomIn className="h-4 w-4 text-[#b9cacb]" />
                          </button>
                        </div>
                      </div>
                    )}
                    {submission.notes && (
                      <div className="mb-4 border-t border-[#3b494b] pt-4">
                        <p className="font-mono text-xs uppercase text-[#b9cacb] mb-2">Student Notes:</p>
                        <p className="font-mono text-sm text-[#e2e8e2]">{submission.notes}</p>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-4 text-xs font-mono text-[#b9cacb]">
                      <div>
                        <span>Submitted: {formatDate(submission.created_at)}</span>
                      </div>
                      {submission.ai_score !== null && (
                        <div>
                          <span>Score: <span className="text-[#00f0ff]">{submission.ai_score}</span>/{submission.assignment.max_score}</span>
                        </div>
                      )}
                    </div>
                    {submission.ai_feedback && (
                      <div className="mt-4 border-t border-[#3b494b] pt-4">
                        <p className="font-mono text-xs uppercase text-[#b9cacb] mb-2">Feedback:</p>
                        <p className="font-mono text-sm text-[#e2e8e2]">{submission.ai_feedback}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 sm:min-w-[200px]">
                    <a
                      href={submission.live_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 border border-[#3b494b] bg-[#0c0e12] px-4 py-2 font-mono text-xs uppercase text-[#b9cacb] transition hover:border-[#00f0ff] hover:text-[#00f0ff]"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open Link
                    </a>
                    <button
                      onClick={() => openReviewModal(submission)}
                      className="flex items-center justify-center gap-2 border border-[#00f0ff] bg-[#00f0ff] px-4 py-2 font-mono text-xs uppercase font-bold text-black transition hover:bg-white"
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
          <div className="w-full max-w-lg rounded-xl border border-[#1f2229] bg-[#0c0e12] p-8 shadow-2xl">
            <h2 className="mb-4 font-heading text-2xl font-bold text-white">
              Review Submission
            </h2>
            <p className="mb-6 font-mono text-sm text-[#b9cacb]">
              {reviewingSubmission.assignment.title}
            </p>

            <form onSubmit={handleReview} className="space-y-4">
              <div>
                <label className="mb-2 block font-mono text-xs uppercase text-[#b9cacb]">
                  Score *
                </label>
                <input
                  type="number"
                  value={reviewData.score}
                  onChange={(e) => setReviewData({ ...reviewData, score: parseInt(e.target.value) })}
                  min="0"
                  max={reviewingSubmission.assignment.max_score}
                  required
                  className="w-full border border-[#3b494b] bg-[#1a1d24] px-4 py-3 font-mono text-sm text-[#e2e8e2] focus:border-[#00f0ff] focus:outline-none"
                />
                <p className="mt-1 font-mono text-xs text-[#b9cacb]">
                  Max: {reviewingSubmission.assignment.max_score}
                </p>
              </div>

              <div>
                <label className="mb-2 block font-mono text-xs uppercase text-[#b9cacb]">
                  Status *
                </label>
                <select
                  value={reviewData.status}
                  onChange={(e) => setReviewData({ ...reviewData, status: e.target.value as 'approved' | 'needs_revision' })}
                  className="w-full border border-[#3b494b] bg-[#1a1d24] px-4 py-3 font-mono text-sm text-[#e2e8e2] focus:border-[#00f0ff] focus:outline-none"
                >
                  <option value="approved">Approved</option>
                  <option value="needs_revision">Needs Revision</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block font-mono text-xs uppercase text-[#b9cacb]">
                  Feedback
                </label>
                <textarea
                  value={reviewData.feedback}
                  onChange={(e) => setReviewData({ ...reviewData, feedback: e.target.value })}
                  rows={4}
                  placeholder="Provide feedback to the student..."
                  className="w-full border border-[#3b494b] bg-[#1a1d24] px-4 py-3 font-mono text-sm text-[#e2e8e2] focus:border-[#00f0ff] focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setReviewingSubmission(null);
                    setReviewData({ score: 0, feedback: '', status: 'approved' });
                  }}
                  className="font-mono text-sm text-[#b9cacb] hover:text-white px-6 py-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#00f0ff] text-black font-bold uppercase tracking-wider font-mono px-6 py-3 rounded hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Saving...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {imageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setImageModal(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={imageModal}
              alt="Full size screenshot"
              className="max-h-[90vh] max-w-full rounded"
            />
            <button
              onClick={() => setImageModal(null)}
              className="absolute top-4 right-4 bg-[#ff6b6b] text-white rounded-full p-2 hover:bg-[#ff4444]"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
