'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Target,
  Users,
  CheckCircle2,
  XCircle
} from 'lucide-react'

interface Assignment {
  id: string
  title: string
  description: string | null
  type: string
  instructions: string | null
  max_score: number
  is_required: boolean
  created_at: string
  lesson: {
    uuid_id: string
    title: string
    product: {
      id: string
      title: string
    }
  }
}

export default function AuthorAssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = useAuth()
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (params) {
      params.then(p => fetchAssignment(p.id))
    }
  }, [params, userId])

  const fetchAssignment = async (assignmentId: string) => {
    if (!userId) return

    try {
      const res = await fetch(`/api/author/assignments/${assignmentId}`)
      const data = await res.json()

      if (data.success) {
        setAssignment(data.assignment)
      } else {
        setError(data.error || 'Failed to load assignment')
      }
    } catch (err) {
      setError('Network error loading assignment')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!assignment || !confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      return
    }

    setDeleting(true)
    try {
      const res = await fetch(`/api/author/assignments/${assignment.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        window.location.href = '/author/assignments'
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to delete assignment')
      }
    } catch (err) {
      setError('Network error deleting assignment')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--card)]">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center text-brand-text/60 py-12">Loading assignment...</div>
        </div>
      </div>
    )
  }

  if (error || !assignment) {
    return (
      <div className="min-h-screen bg-[var(--card)]">
        <div className="container mx-auto px-4 py-12">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error || 'Assignment not found'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--card)]">
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/author/assignments" className="text-brand-text/70 hover:text-brand-text">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-brand-text">{assignment.title}</h1>
            <p className="text-sm text-brand-text/70 mt-1">
              {assignment.lesson.product.title} → {assignment.lesson.title}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/author/products/${assignment.lesson.product.id}/curriculum`}
              className="px-4 py-2 bg-[var(--card)] brightness-95 text-neutral-700 text-sm font-semibold rounded-lg hover:bg-neutral-200 transition-colors"
            >
              Edit in Curriculum
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 bg-red-50 text-red-700 text-sm font-semibold rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>

        {assignment.description && (
          <div className="bg-brand-bg border border-brand-border p-4 rounded-lg mb-6">
            <p className="text-neutral-700">{assignment.description}</p>
          </div>
        )}

        {assignment.instructions && (
          <div className="bg-brand-bg border border-brand-border p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-brand-text mb-2">Instructions</h3>
            <p className="text-neutral-700 whitespace-pre-line">{assignment.instructions}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-4 mb-6 text-sm text-brand-text/70">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span>Max Score: {assignment.max_score}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded capitalize">
              {assignment.type}
            </span>
          </div>
          {assignment.is_required && (
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-orange-50 text-orange-700 text-xs font-semibold rounded">
                Required
              </span>
            </div>
          )}
        </div>

        <div className="mt-8 flex gap-2">
          <Link
            href={`/author/assignments/${assignment.id}/submissions`}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white text-sm font-semibold rounded-lg hover:bg-sky-700 transition-colors"
          >
            <Users className="h-4 w-4" />
            Review Student Submissions
          </Link>
        </div>
      </div>
    </div>
  )
}
