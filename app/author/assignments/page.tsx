'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { 
  Edit, 
  Eye, 
  Clock, 
  Target, 
  Users, 
  ArrowLeft,
  CheckCircle2,
  XCircle
} from 'lucide-react'

interface Assignment {
  id: string
  title: string
  description: string | null
  type: string
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
  submissions: { count: number }[]
}

export default function AuthorAssignmentsPage() {
  const { userId } = useAuth()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAssignments()
  }, [userId])

  const fetchAssignments = async () => {
    if (!userId) return

    try {
      const res = await fetch('/api/author/assignments')
      const data = await res.json()

      if (data.success) {
        setAssignments(data.assignments)
      } else {
        setError(data.error || 'Failed to load assignments')
      }
    } catch (err) {
      setError('Network error loading assignments')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center text-neutral-500 py-12">Loading assignments...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/author" className="text-neutral-600 hover:text-neutral-900">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Assignments</h1>
            <p className="text-sm text-neutral-600">Manage your lesson assignments and review student submissions</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {assignments.length === 0 ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-neutral-100 rounded-full">
                <Target className="h-8 w-8 text-neutral-400" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900">No assignments yet</h3>
              <p className="text-neutral-500">Create assignments for your lessons to assess student work</p>
              <Link
                href="/author/products"
                className="px-6 py-2 bg-sky-600 text-white text-sm font-semibold rounded-lg hover:bg-sky-700 transition-colors"
              >
                Go to Products
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="border border-neutral-200 bg-neutral-50 p-6 rounded-xl hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-sky-50 text-sky-700 text-xs font-semibold rounded">
                        {assignment.lesson.product.title}
                      </span>
                      <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded capitalize">
                        {assignment.type}
                      </span>
                      {assignment.is_required && (
                        <span className="px-2 py-1 bg-orange-50 text-orange-700 text-xs font-semibold rounded">
                          Required
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-neutral-900 mb-1">{assignment.title}</h3>
                    {assignment.description && (
                      <p className="text-sm text-neutral-600 mb-2">{assignment.description}</p>
                    )}
                    <p className="text-xs text-neutral-500">
                      Lesson: {assignment.lesson.title}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 mb-4 text-sm text-neutral-600">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    <span>Max Score: {assignment.max_score}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Submissions: {assignment.submissions?.[0]?.count || 0}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/author/assignments/${assignment.id}`}
                    className="flex items-center gap-2 text-sky-600 hover:text-sky-700 text-sm font-semibold transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Assignment
                  </Link>
                  <Link
                    href={`/author/assignments/${assignment.id}/submissions`}
                    className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 text-sm font-semibold transition-colors"
                  >
                    <Users className="h-4 w-4" />
                    Review Submissions
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
