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

interface Response {
  id: string
  score: number
  submitted_at: string
  quiz: {
    id: string
    title: string
    passing_score: number
  }
  user: {
    id: string
    first_name: string | null
    last_name: string | null
    email_addresses: Array<{ email_address: string }>
  }
}

export default function AuthorQuizResponsesPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = useAuth()
  const [responses, setResponses] = useState<Response[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quizId, setQuizId] = useState<string>('')

  useEffect(() => {
    if (params) {
      params.then(p => {
        setQuizId(p.id)
        fetchResponses(p.id)
      })
    }
  }, [params, userId])

  const fetchResponses = async (quizId: string) => {
    if (!userId) return

    try {
      const res = await fetch(`/api/author/quizzes/${quizId}/responses`)
      const data = await res.json()

      if (data.success) {
        setResponses(data.responses)
      } else {
        setError(data.error || 'Failed to load responses')
      }
    } catch (err) {
      setError('Network error loading responses')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center text-neutral-500 py-12">Loading responses...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/author/quizzes/${quizId}`} className="text-neutral-600 hover:text-neutral-900">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Student Responses</h1>
            <p className="text-sm text-neutral-600 mt-1">Review quiz submissions and scores</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {responses.length === 0 ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-neutral-100 rounded-full">
                <User className="h-8 w-8 text-neutral-400" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900">No responses yet</h3>
              <p className="text-neutral-500">Students haven't submitted this quiz yet</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {responses.map((response) => (
              <div
                key={response.id}
                className="border border-neutral-200 bg-neutral-50 p-6 rounded-xl hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-sky-50 rounded-full">
                        <User className="h-5 w-5 text-sky-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-neutral-900">
                          {response.user.first_name} {response.user.last_name}
                        </h3>
                        <p className="text-sm text-neutral-600">
                          {response.user.email_addresses?.[0]?.email_address}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end mb-1">
                      {response.score >= response.quiz.passing_score ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span className={`text-2xl font-bold ${
                        response.score >= response.quiz.passing_score
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {response.score}%
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500">
                      Pass: {response.quiz.passing_score}%
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <Clock className="h-4 w-4" />
                  <span>
                    Submitted: {new Date(response.submitted_at).toLocaleString()}
                  </span>
                </div>

                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/author/quizzes/${response.quiz.id}/responses/${response.id}`}
                    className="px-4 py-2 bg-sky-600 text-white text-sm font-semibold rounded-lg hover:bg-sky-700 transition-colors"
                  >
                    View Details
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
