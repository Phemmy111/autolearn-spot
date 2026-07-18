'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Edit, Trash2, GripVertical } from 'lucide-react'
import Link from 'next/link'

interface Question {
  id: string
  question_text: string
  question_type: string
  options: any
  correct_answer: string
  explanation: string | null
  points: number
  order_index: number
}

export default function QuizQuestionsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const [loading, setLoading] = useState(true)
  const [quiz, setQuiz] = useState<any>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const [quizRes, questionsRes] = await Promise.all([
          fetch(`/api/admin/quizzes/${id}`),
          fetch(`/api/admin/quizzes/${id}/questions`),
        ])

        if (!quizRes.ok) {
          const error = await quizRes.json()
          setError(error.error || 'Failed to load quiz')
        } else {
          const { quiz } = await quizRes.json()
          setQuiz(quiz)
        }

        if (!questionsRes.ok) {
          const error = await questionsRes.json()
          setError(error.error || 'Failed to load questions')
        } else {
          const { questions } = await questionsRes.json()
          setQuestions(questions || [])
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load data')
      }

      setLoading(false)
    }
    loadData()
  }, [id])

  const handleDelete = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) {
      return
    }

    try {
      const res = await fetch(`/api/admin/quizzes/${id}/questions/${questionId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete question')
      }

      setQuestions(prev => prev.filter(q => q.id !== questionId))
    } catch (err: any) {
      setError(err.message || 'Failed to delete question')
    }
  }

  const handleReorder = async (questionId: string, newIndex: number) => {
    const updatedQuestions = [...questions]
    const questionIndex = updatedQuestions.findIndex(q => q.id === questionId)
    const [question] = updatedQuestions.splice(questionIndex, 1)
    updatedQuestions.splice(newIndex, 0, question)

    // Update order_index for all questions
    const updates = updatedQuestions.map((q, index) => ({
      id: q.id,
      order_index: index,
    }))

    try {
      await Promise.all(
        updates.map(update =>
          fetch(`/api/admin/quizzes/${id}/questions/${update.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_index: update.order_index }),
          })
        )
      )

      setQuestions(updatedQuestions.map((q, index) => ({ ...q, order_index: index })))
    } catch (err: any) {
      setError(err.message || 'Failed to reorder questions')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00f0ff]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0c10]">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <Link
            href="/admin/quizzes"
            className="flex items-center gap-2 text-[#b9cacb] hover:text-white font-mono text-sm mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Quizzes
          </Link>
          <h1 className="font-heading text-4xl font-bold text-white mb-2">{quiz?.title || 'Quiz'}</h1>
          <p className="font-mono text-sm text-[#b9cacb]">Manage quiz questions</p>
        </div>

        {error && (
          <div className="mb-6 border border-red-500/50 bg-red-500/10 p-4 rounded-lg">
            <p className="font-mono text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="mb-6">
          <Link
            href={`/admin/quizzes/${id}/questions/new`}
            className="flex items-center gap-2 bg-[#00f0ff] text-black font-bold uppercase tracking-wider font-mono px-6 py-2 rounded hover:bg-white transition-colors text-sm"
          >
            <Plus className="h-4 w-4" />
            Add Question
          </Link>
        </div>

        {questions.length === 0 ? (
          <div className="text-center py-12 border border-[#1f2229] bg-[#0c0e12] rounded-xl">
            <p className="font-mono text-sm text-[#b9cacb]">No questions yet. Add your first question!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {questions.map((question, index) => (
              <div
                key={question.id}
                className="border border-[#1f2229] bg-[#0c0e12] p-4 rounded-xl hover:border-[#00f0ff]/50 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="flex flex-col gap-1 pt-1">
                    <button
                      onClick={() => handleReorder(question.id, Math.max(0, index - 1))}
                      disabled={index === 0}
                      className="text-[#5d5f63] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => handleReorder(question.id, Math.min(questions.length - 1, index + 1))}
                      disabled={index === questions.length - 1}
                      className="text-[#5d5f63] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      ▼
                    </button>
                  </div>
                  
                  <GripVertical className="h-5 w-5 text-[#5d5f63] mt-1" />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-[#00f0ff]/10 text-[#00f0ff] font-mono text-xs rounded">
                        Q{index + 1}
                      </span>
                      <span className="px-2 py-1 bg-[#1f2229] text-[#b9cacb] font-mono text-xs rounded">
                        {question.question_type}
                      </span>
                      <span className="px-2 py-1 bg-[#1f2229] text-[#b9cacb] font-mono text-xs rounded">
                        {question.points} pts
                      </span>
                    </div>
                    <p className="font-mono text-sm text-white line-clamp-2">{question.question_text}</p>
                    {question.explanation && (
                      <p className="font-mono text-xs text-[#5d5f63] mt-2 line-clamp-1">
                        Explanation: {question.explanation}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/quizzes/${id}/questions/${question.id}`}
                      className="text-[#00f0ff] hover:text-white"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(question.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
