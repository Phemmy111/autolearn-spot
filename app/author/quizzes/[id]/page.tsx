'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Plus,
  Clock,
  Target,
  Users,
  CheckCircle2,
  XCircle
} from 'lucide-react'

interface Question {
  id: string
  question_text: string
  question_type: string
  options: string[]
  correct_answer: string
  explanation: string
  points: number
}

interface Quiz {
  id: string
  title: string
  description: string | null
  time_limit: number | null
  passing_score: number
  is_active: boolean
  lesson: {
    uuid_id: string
    title: string
    product: {
      id: string
      title: string
    }
  }
  questions: Question[]
}

export default function AuthorQuizDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = useAuth()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (params) {
      params.then(p => fetchQuiz(p.id))
    }
  }, [params, userId])

  const fetchQuiz = async (quizId: string) => {
    if (!userId) return

    try {
      const res = await fetch(`/api/author/quizzes/${quizId}`)
      const data = await res.json()

      if (data.success) {
        setQuiz(data.quiz)
      } else {
        setError(data.error || 'Failed to load quiz')
      }
    } catch (err) {
      setError('Network error loading quiz')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!quiz || !confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      return
    }

    setDeleting(true)
    try {
      const res = await fetch(`/api/author/quizzes/${quiz.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        window.location.href = '/author/quizzes'
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to delete quiz')
      }
    } catch (err) {
      setError('Network error deleting quiz')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center text-neutral-500 py-12">Loading quiz...</div>
        </div>
      </div>
    )
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-12">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error || 'Quiz not found'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/author/quizzes" className="text-neutral-600 hover:text-neutral-900">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-neutral-900">{quiz.title}</h1>
            <p className="text-sm text-neutral-600 mt-1">
              {quiz.lesson.product.title} → {quiz.lesson.title}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/author/products/${quiz.lesson.product.id}/curriculum`}
              className="px-4 py-2 bg-neutral-100 text-neutral-700 text-sm font-semibold rounded-lg hover:bg-neutral-200 transition-colors"
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

        {quiz.description && (
          <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-lg mb-6">
            <p className="text-neutral-700">{quiz.description}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-4 mb-6 text-sm text-neutral-600">
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
            <span>Questions: {quiz.questions.length}</span>
          </div>
          <div className="flex items-center gap-2">
            {quiz.is_active ? (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                Active
              </span>
            ) : (
              <span className="flex items-center gap-1 text-yellow-600">
                <XCircle className="h-4 w-4" />
                Draft
              </span>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-neutral-900">Questions</h2>
          {quiz.questions.map((question, index) => (
            <div
              key={question.id}
              className="border border-neutral-200 bg-neutral-50 p-4 rounded-lg"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-sky-50 text-sky-700 text-xs font-semibold rounded">
                      Q{index + 1}
                    </span>
                    <span className="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs font-semibold rounded capitalize">
                      {question.question_type.replace('_', ' ')}
                    </span>
                    <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded">
                      {question.points} pts
                    </span>
                  </div>
                  <p className="font-medium text-neutral-900">{question.question_text}</p>
                </div>
              </div>

              {question.options && question.options.length > 0 && (
                <div className="mt-3 space-y-2">
                  {question.options.map((option, optIndex) => (
                    <div
                      key={optIndex}
                      className={`flex items-center gap-2 text-sm ${
                        option === question.correct_answer
                          ? 'text-green-700 bg-green-50'
                          : 'text-neutral-600'
                      } p-2 rounded`}
                    >
                      <span className="font-mono">{String.fromCharCode(65 + optIndex)}.</span>
                      <span>{option}</span>
                      {option === question.correct_answer && (
                        <CheckCircle2 className="h-4 w-4 ml-auto" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {question.explanation && (
                <div className="mt-3 pt-3 border-t border-neutral-200">
                  <p className="text-sm text-neutral-600">
                    <span className="font-semibold">Explanation:</span> {question.explanation}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 flex gap-2">
          <Link
            href={`/author/quizzes/${quiz.id}/responses`}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white text-sm font-semibold rounded-lg hover:bg-sky-700 transition-colors"
          >
            <Users className="h-4 w-4" />
            Review Student Responses
          </Link>
          <Link
            href={`/quiz/${quiz.id}?preview=true`}
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 bg-neutral-100 text-neutral-700 text-sm font-semibold rounded-lg hover:bg-neutral-200 transition-colors"
          >
            Preview Quiz
          </Link>
        </div>
      </div>
    </div>
  )
}
