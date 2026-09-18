'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { 
  ArrowLeft, 
  User, 
  Clock, 
  CheckCircle2,
  XCircle,
  Download
} from 'lucide-react'

interface Submission {
  id: string
  score: number | null
  created_at: string
  screenshot_url: string | null
  live_url: string | null
  notes: string | null
  ai_feedback: string | null
  ai_score: number | null
  status: string
  assignment: {
    id: string
    title: string
    max_score: number
  }
  user_id: string
}

export default function AuthorAssignmentSubmissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = useAuth()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assignmentId, setAssignmentId] = useState<string>('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    score: '',
    feedback: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (params) {
      params.then(p => {
        setAssignmentId(p.id)
        fetchSubmissions(p.id)
      })
    }
  }, [params, userId])

  const fetchSubmissions = async (assignmentId: string) => {
    if (!userId) return

    try {
      const res = await fetch(`/api/author/assignments/${assignmentId}/submissions`)
      const data = await res.json()

      if (data.success) {
        setSubmissions(data.submissions)
      } else {
        setError(data.error || 'Failed to load submissions')
      }
    } catch (err) {
      setError('Network error loading submissions')
    } finally {
      setLoading(false)
    }
  }

  const handleStartEdit = (submission: Submission) => {
    setEditingId(submission.id)
    setEditForm({
      score: submission.score?.toString() || '',
      feedback: submission.ai_feedback || ''
    })
  }

  const handleSave = async (submissionId: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/author/submissions/${submissionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: parseInt(editForm.score) || null,
          feedback: editForm.feedback
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setSubmissions(submissions.map(s => 
          s.id === submissionId 
            ? { ...s, ai_score: data.submission.ai_score, ai_feedback: data.submission.ai_feedback }
            : s
        ))
        setEditingId(null)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to update submission')
      }
    } catch (err) {
      setError('Network error updating submission')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditForm({ score: '', feedback: '' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--card)]">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center text-brand-text/60 py-12">Loading submissions...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--card)]">
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/author/assignments/${assignmentId}`} className="text-brand-text/70 hover:text-brand-text">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-brand-text">Student Submissions</h1>
            <p className="text-sm text-brand-text/70 mt-1">Review assignment submissions and provide feedback</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {submissions.length === 0 ? (
          <div className="bg-[var(--card)] rounded-xl border border-brand-border p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-[var(--card)] brightness-95 rounded-full">
                <User className="h-8 w-8 text-neutral-400" />
              </div>
              <h3 className="text-lg font-semibold text-brand-text">No submissions yet</h3>
              <p className="text-brand-text/60">Students haven't submitted this assignment yet</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="border border-brand-border bg-brand-bg p-6 rounded-xl hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-sky-50 rounded-full">
                        <User className="h-5 w-5 text-sky-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-brand-text">
                          {submission.user?.name || 'Unknown Student'}
                        </h3>
                        <p className="text-sm text-brand-text/70">
                          {submission.user?.email || submission.user_id}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {submission.ai_score !== null ? (
                      <div className="flex items-center gap-2 justify-end mb-1">
                        <span className="text-2xl font-bold text-brand-text">
                          {submission.ai_score}/{submission.assignment.max_score}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-brand-text/60">Not graded</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-brand-text/70 mb-4">
                  <Clock className="h-4 w-4" />
                  <span>
                    Submitted: {new Date(submission.created_at).toLocaleString()}
                  </span>
                </div>

                {submission.screenshot_url && (
                  <div className="mb-4">
                    <a
                      href={submission.screenshot_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-700 text-sm font-medium"
                    >
                      <Download className="h-4 w-4" />
                      View Screenshot
                    </a>
                  </div>
                )}

                {submission.live_url && (
                  <div className="mb-4">
                    <a
                      href={submission.live_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-700 text-sm font-medium"
                    >
                      <Download className="h-4 w-4" />
                      View Live URL
                    </a>
                  </div>
                )}

                {submission.ai_feedback && (
                  <div className="bg-[var(--card)] border border-brand-border p-3 rounded-lg mb-4">
                    <p className="text-sm text-brand-text/70">
                      <span className="font-semibold">AI Feedback:</span> {submission.ai_feedback}
                    </p>
                  </div>
                )}

                {submission.notes && (
                  <div className="bg-[var(--card)] border border-brand-border p-3 rounded-lg mb-4">
                    <p className="text-sm text-brand-text/70">
                      <span className="font-semibold">Notes:</span> {submission.notes}
                    </p>
                  </div>
                )}

                {editingId === submission.id ? (
                  <div className="bg-[var(--card)] border border-brand-border p-4 rounded-lg mb-4">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-brand-text/70 mb-2">Score (out of {submission.assignment.max_score})</label>
                      <input
                        type="number"
                        value={editForm.score}
                        onChange={(e) => setEditForm({...editForm, score: e.target.value})}
                        min="0"
                        max={submission.assignment.max_score}
                        className="w-full px-4 py-2 bg-brand-bg border border-brand-border rounded-lg text-brand-text focus:border-brand-primary outline-none"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-brand-text/70 mb-2">Feedback</label>
                      <textarea
                        value={editForm.feedback}
                        onChange={(e) => setEditForm({...editForm, feedback: e.target.value})}
                        rows={3}
                        className="w-full px-4 py-2 bg-brand-bg border border-brand-border rounded-lg text-brand-text focus:border-brand-primary outline-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSave(submission.id)}
                        disabled={saving}
                        className="px-4 py-2 bg-sky-600 text-white text-sm font-semibold rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save Feedback'}
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={saving}
                        className="px-4 py-2 bg-[var(--card)] brightness-95 text-neutral-700 text-sm font-semibold rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleStartEdit(submission)}
                      className="px-4 py-2 bg-sky-600 text-white text-sm font-semibold rounded-lg hover:bg-sky-700 transition-colors"
                    >
                      Grade & Provide Feedback
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
