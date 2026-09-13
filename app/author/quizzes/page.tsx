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

interface Quiz {
  id: string
  title: string
  description: string | null
  time_limit: number | null
  passing_score: number
  is_active: boolean
  created_at: string
  lesson: {
    uuid_id: string
    title: string
    product: {
      id: string
      title: string
    }
  }
  questions: { count: number }[]
  responses: { count: number }[]
}

export default function AuthorQuizzesPage() {
  const { userId } = useAuth()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchQuizzes()
  }, [userId])

  const fetchQuizzes = async () => {
    if (!userId) return

    try {
      const res = await fetch('/api/author/quizzes')
      const data = await res.json()

      if (data.success) {
        setQuizzes(data.quizzes)
      } else {
        setError(data.error || 'Failed to load quizzes')
      }
    } catch (err) {
      setError('Network error loading quizzes')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center text-neutral-500 py-12">Loading quizzes...</div>
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
            <h1 className="text-3xl font-bold text-neutral-900">Quizzes</h1>
            <p className="text-sm text-neutral-600">Manage your lesson quizzes and review student responses</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {quizzes.length === 0 ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-neutral-100 rounded-full">
                <Target className="h-8 w-8 text-neutral-400" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900">No quizzes yet</h3>
              <p className="text-neutral-500">Create quizzes for your lessons to test student understanding</p>
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
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="border border-neutral-200 bg-neutral-50 p-6 rounded-xl hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-sky-50 text-sky-700 text-xs font-semibold rounded">
                        {quiz.lesson.product.title}
                      </span>
                      {!quiz.is_active && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">
                          Draft
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-neutral-900 mb-1">{quiz.title}</h3>
                    {quiz.description && (
                      <p className="text-sm text-neutral-600 mb-2">{quiz.description}</p>
                    )}
                    <p className="text-xs text-neutral-500">
                      Lesson: {quiz.lesson.title}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 mb-4 text-sm text-neutral-600">
                  {quiz.time_limit && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{quiz.time_limit} mins</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    <span>Pass: {quiz.passing_score}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Questions: {quiz.questions?.[0]?.count || 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Responses: {quiz.responses?.[0]?.count || 0}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/author/quizzes/${quiz.id}`}
                    className="flex items-center gap-2 text-sky-600 hover:text-sky-700 text-sm font-semibold transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Quiz
                  </Link>
                  <Link
                    href={`/author/quizzes/${quiz.id}/responses`}
                    className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 text-sm font-semibold transition-colors"
                  >
                    <Users className="h-4 w-4" />
                    Review Responses
                  </Link>
                  <Link
                    href={`/quiz/${quiz.id}?preview=true`}
                    target="_blank"
                    className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 text-sm font-semibold transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    Preview
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
