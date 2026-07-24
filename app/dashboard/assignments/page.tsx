"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, ExternalLink, Edit, CheckCircle, Upload, X, Eye } from 'lucide-react';

interface Assignment {
  id: string;
  week_number: number;
  title: string;
  description: string;
  instructions: string;
  due_date: string | null;
  max_score: number;
  is_required: boolean;
  submissions: Submission[];
}

interface Submission {
  id: string;
  live_url: string;
  screenshot_url: string | null;
  notes: string | null;
  status: 'submitted' | 'approved' | 'needs_revision';
  ai_score: number | null;
  ai_feedback: string | null;
  created_at: string;
  updated_at: string;
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [viewingSubmission, setViewingSubmission] = useState<{ assignment: Assignment; submission: Submission } | null>(null);
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const res = await fetch('/api/assignments');
      if (!res.ok) throw new Error('Failed to fetch assignments');
      const data = await res.json();
      setAssignments(data.assignments || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only PNG, JPG, JPEG, and WEBP images are allowed');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setFilePreview(URL.createObjectURL(file));
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('assignmentId', selectedAssignment!.id);

    const res = await fetch('/api/upload/assignment-screenshot', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) throw new Error('Failed to upload file');

    const data = await res.json();
    return data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    if (!submissionUrl && !selectedFile && !notes.trim()) {
      setError('Please provide a URL, upload a screenshot, or add notes');
      return;
    }

    setSubmitting(true);
    try {
      let screenshotUrl: string | null = null;

      if (selectedFile) {
        setUploading(true);
        screenshotUrl = await uploadFile(selectedFile);
        setUploading(false);
      }

      const res = await fetch(`/api/assignments/${selectedAssignment.id}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_url: submissionUrl || null,
          notes,
          screenshot_url: screenshotUrl,
        }),
      });

      if (!res.ok) throw new Error('Failed to submit assignment');

      setToastMessage('Assignment submitted successfully!');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);

      setSelectedAssignment(null);
      setSubmissionUrl('');
      setNotes('');
      setSelectedFile(null);
      setFilePreview(null);
      fetchAssignments();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'No due date';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
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

  const openViewModal = (assignment: Assignment, submission: Submission) => {
    setViewingSubmission({ assignment, submission });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111317] text-[#e2e8e2] flex items-center justify-center">
        <div className="font-mono text-sm text-[#b9cacb]">Loading assignments...</div>
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
        <Link className="flex items-center gap-2 font-mono text-sm font-bold uppercase text-white" href="/dashboard">
          <span className="text-[#00f0ff]">//</span>
          <span className="underline decoration-[#b9cacb] decoration-2 underline-offset-2">AutoLearn Spot</span>
        </Link>
        <div className="font-mono text-xs uppercase text-[#b9cacb]">
          Assignments
        </div>
      </nav>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="mb-8 font-heading text-3xl font-bold uppercase text-white">Assignments</h1>

        {assignments.length === 0 ? (
          <div className="border border-[#3b494b] bg-[#1a1d24] p-8 text-center">
            <p className="font-mono text-sm text-[#b9cacb]">No assignments available yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => {
              const submission = assignment.submissions[0];
              const canEdit = submission && submission.status === 'submitted';

              return (
                <div
                  key={assignment.id}
                  className="border border-[#3b494b] bg-[#1a1d24] p-6"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-xs uppercase text-[#00f0ff]">
                          Week {assignment.week_number}
                        </span>
                        {submission && getStatusBadge(submission.status)}
                      </div>
                      <h2 className="mb-2 font-heading text-xl font-bold text-white">
                        {assignment.title}
                      </h2>
                      {assignment.description && (
                        <p className="mb-4 font-mono text-sm text-[#b9cacb]">
                          {assignment.description}
                        </p>
                      )}
                      {assignment.instructions && (
                        <div className="mb-4 font-mono text-sm text-[#b9cacb] whitespace-pre-line">
                          {assignment.instructions}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-4 text-xs font-mono text-[#b9cacb]">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Due: {formatDate(assignment.due_date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>Max Score: {assignment.max_score}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:min-w-[200px]">
                      {submission ? (
                        <>
                          {/* View Submission button */}
                          <button
                            onClick={() => openViewModal(assignment, submission)}
                            className="flex items-center justify-center gap-2 border border-[#00f0ff] bg-[#00f0ff]/10 px-4 py-2 font-mono text-xs uppercase text-[#00f0ff] transition hover:bg-[#00f0ff]/20 hover:border-[#00f0ff]"
                          >
                            <Eye className="h-4 w-4" />
                            View Submission
                          </button>
                          {canEdit && (
                            <button
                              onClick={() => {
                                setSelectedAssignment(assignment);
                                setSubmissionUrl(submission.live_url || '');
                                setNotes(submission.notes || '');
                                setSelectedFile(null);
                                setFilePreview(null);
                              }}
                              className="flex items-center justify-center gap-2 border border-[#3b494b] bg-[#0c0e12] px-4 py-2 font-mono text-xs uppercase text-[#b9cacb] transition hover:border-[#00f0ff] hover:text-[#00f0ff]"
                            >
                              <Edit className="h-4 w-4" />
                              Edit Submission
                            </button>
                          )}
                          {submission.ai_score !== null && (
                            <div className="text-center font-mono text-xs text-[#b9cacb]">
                              Score: <span className="text-[#00f0ff]">{submission.ai_score}</span>/{assignment.max_score}
                            </div>
                          )}
                        </>
                      ) : (
                        <button
                          onClick={() => setSelectedAssignment(assignment)}
                          className="flex items-center justify-center gap-2 border border-[#00f0ff] bg-[#00f0ff] px-4 py-2 font-mono text-xs uppercase font-bold text-black transition hover:bg-white"
                        >
                          Submit Assignment
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* View Submission Modal */}
      {viewingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-[#1f2229] bg-[#0c0e12] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-xl font-bold text-white">
                Submission Details
              </h2>
              <button
                onClick={() => setViewingSubmission(null)}
                className="text-[#b9cacb] hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Assignment title */}
            <p className="mb-6 font-mono text-sm text-[#00f0ff]">
              {viewingSubmission.assignment.title}
            </p>

            {/* Status */}
            <div className="mb-4">
              <span className="font-mono text-xs uppercase text-[#b9cacb] mr-2">Status:</span>
              {getStatusBadge(viewingSubmission.submission.status)}
            </div>

            {/* Screenshot preview */}
            {viewingSubmission.submission.screenshot_url && (
              <div className="mb-4">
                <p className="font-mono text-xs uppercase text-[#b9cacb] mb-2">Screenshot:</p>
                <a
                  href={viewingSubmission.submission.screenshot_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block group"
                >
                  <img
                    src={viewingSubmission.submission.screenshot_url}
                    alt="Submission screenshot"
                    className="max-h-48 rounded border border-[#3b494b] group-hover:border-[#00f0ff] transition-colors"
                  />
                  <span className="block mt-1 font-mono text-xs text-[#b9cacb] group-hover:text-[#00f0ff] transition-colors">
                    Click to open full image ↗
                  </span>
                </a>
              </div>
            )}

            {/* Live URL */}
            {viewingSubmission.submission.live_url && (
              <div className="mb-4">
                <p className="font-mono text-xs uppercase text-[#b9cacb] mb-2">Submitted URL:</p>
                <a
                  href={viewingSubmission.submission.live_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 font-mono text-sm text-[#00f0ff] hover:text-white transition-colors break-all"
                >
                  <ExternalLink className="h-4 w-4 flex-shrink-0" />
                  {viewingSubmission.submission.live_url}
                </a>
              </div>
            )}

            {/* Notes */}
            {viewingSubmission.submission.notes && (
              <div className="mb-4 border-t border-[#3b494b] pt-4">
                <p className="font-mono text-xs uppercase text-[#b9cacb] mb-2">Notes:</p>
                <p className="font-mono text-sm text-[#e2e8e2] whitespace-pre-line">
                  {viewingSubmission.submission.notes}
                </p>
              </div>
            )}

            {/* Submission date */}
            <div className="mb-4 border-t border-[#3b494b] pt-4">
              <p className="font-mono text-xs uppercase text-[#b9cacb] mb-1">Submitted:</p>
              <p className="font-mono text-sm text-[#e2e8e2]">
                {formatDate(viewingSubmission.submission.created_at)}
              </p>
            </div>

            {/* Score */}
            {viewingSubmission.submission.ai_score !== null && (
              <div className="mb-4">
                <p className="font-mono text-xs uppercase text-[#b9cacb] mb-1">Score:</p>
                <p className="font-mono text-lg text-[#00f0ff] font-bold">
                  {viewingSubmission.submission.ai_score}
                  <span className="text-sm text-[#b9cacb] font-normal">
                    /{viewingSubmission.assignment.max_score}
                  </span>
                </p>
              </div>
            )}

            {/* Feedback */}
            {viewingSubmission.submission.ai_feedback && (
              <div className="mb-4 border-t border-[#3b494b] pt-4">
                <p className="font-mono text-xs uppercase text-[#b9cacb] mb-2">Feedback:</p>
                <p className="font-mono text-sm text-[#e2e8e2] whitespace-pre-line">
                  {viewingSubmission.submission.ai_feedback}
                </p>
              </div>
            )}

            {/* No submission data message */}
            {!viewingSubmission.submission.screenshot_url &&
             !viewingSubmission.submission.live_url &&
             !viewingSubmission.submission.notes && (
              <div className="mb-4 border border-[#3b494b] bg-[#1a1d24] p-4 text-center">
                <p className="font-mono text-sm text-[#b9cacb]">No submission data available.</p>
              </div>
            )}

            {/* Close button */}
            <div className="flex justify-end pt-4 border-t border-[#3b494b]">
              <button
                onClick={() => setViewingSubmission(null)}
                className="font-mono text-sm text-[#b9cacb] hover:text-white px-4 py-2 border border-[#3b494b] hover:border-[#00f0ff] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submission Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border border-[#1f2229] bg-[#0c0e12] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-xl font-bold text-white">
                Submit Assignment
              </h2>
              <button
                onClick={() => {
                  setSelectedAssignment(null);
                  setSubmissionUrl('');
                  setNotes('');
                  setSelectedFile(null);
                  setFilePreview(null);
                }}
                className="text-[#b9cacb] hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <p className="mb-6 font-mono text-sm text-[#b9cacb]">
              {selectedAssignment.title}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block font-mono text-xs uppercase text-[#b9cacb]">
                  Submission URL
                </label>
                <input
                  type="url"
                  value={submissionUrl}
                  onChange={(e) => setSubmissionUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full border border-[#3b494b] bg-[#1a1d24] px-4 py-3 font-mono text-sm text-[#e2e8e2] focus:border-[#00f0ff] focus:outline-none"
                />
                <p className="mt-2 font-mono text-xs text-[#b9cacb]">
                  GitHub, n8n JSON, Google Drive, Loom, YouTube, or any valid URL
                </p>
              </div>

              <div>
                <label className="mb-2 block font-mono text-xs uppercase text-[#b9cacb]">
                  Screenshot
                </label>
                <div className="border-2 border-dashed border-[#3b494b] bg-[#1a1d24] p-4 text-center">
                  {filePreview ? (
                    <div className="relative">
                      <img
                        src={filePreview}
                        alt="Preview"
                        className="max-h-48 mx-auto rounded"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="absolute top-2 right-2 bg-[#ff6b6b] text-white rounded-full p-1 hover:bg-[#ff4444]"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        id="screenshot"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <label
                        htmlFor="screenshot"
                        className="flex flex-col items-center gap-2 cursor-pointer"
                      >
                        <Upload className="h-8 w-8 text-[#b9cacb]" />
                        <span className="font-mono text-xs text-[#b9cacb]">
                          Click to upload screenshot
                        </span>
                        <span className="font-mono text-xs text-[#6b7b7c]">
                          PNG, JPG, JPEG, WEBP (max 5MB)
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-2 block font-mono text-xs uppercase text-[#b9cacb]">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes..."
                  rows={3}
                  className="w-full border border-[#3b494b] bg-[#1a1d24] px-4 py-3 font-mono text-sm text-[#e2e8e2] focus:border-[#00f0ff] focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAssignment(null);
                    setSubmissionUrl('');
                    setNotes('');
                    setSelectedFile(null);
                    setFilePreview(null);
                  }}
                  className="font-mono text-sm text-[#b9cacb] hover:text-white px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="bg-[#00f0ff] text-black font-bold uppercase tracking-wider font-mono px-4 py-2 rounded hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 border border-[#00f0ff] bg-[#0c0e12] px-6 py-4 shadow-2xl">
          <CheckCircle className="h-5 w-5 text-[#00f0ff]" />
          <span className="font-mono text-sm text-[#e2e8e2]">{toastMessage}</span>
        </div>
      )}
    </main>
  );
}
