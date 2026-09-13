'use client'

import { useEffect, useState } from 'react'
import { BookOpen, Clock, Target, Play, CheckCircle, Lock } from 'lucide-react'
import { fetchQuizzes } from '@/lib/api/quiz'
import { SupabaseQuiz } from '@/types/quiz'
import { useAuth } from '@clerk/nextjs'

export function QuizList() {
  const [quizzes, setQuizzes] = useState<SupabaseQuiz[]>([])
  const [loading, setLoading] = useState(true)
  const { userId } = useAuth()

  useEffect(() => {
    async function loadQuizzes() {
      const data = await fetchQuizzes()
      setQuizzes(data)
      setLoading(false)
    }
    loadQuizzes()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#10b981]" />
      </div>
    )
  }

  if (quizzes.length === 0) {
    return (
      <div className="text-center py-12 border border-neutral-200 bg-gray-50 rounded-xl">
        <BookOpen className="h-12 w-12 text-neutral-500 mx-auto mb-4" />
        <p className="font-mono text-sm text-neutral-500">No quizzes available yet. Check back soon!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {quizzes.map((quiz) => (
        <div
          key={quiz.id}
          className="group border border-neutral-200 bg-gray-50 p-6 rounded-xl transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_4px_20px_rgba(0,240,255,0.08)] hover:border-[#10b981]/50"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 bg-gray-50/10 text-[#10b981] font-mono text-xs rounded">
                  {quiz.phase}
                </span>
                <span className="px-2 py-1 bg-gray-50 text-neutral-500 font-mono text-xs rounded">
                  Week {quiz.week_number}
                </span>
              </div>
              <h3 className="font-heading text-xl font-bold text-neutral-900 mb-2">{quiz.title}</h3>
              {quiz.description && (
                <p className="font-mono text-sm text-neutral-500">{quiz.description}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mb-4 font-mono text-xs text-[#5d5f63]">
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
          </div>

          <div className="flex items-center justify-between">
            {userId ? (
              <a
                href={`/quiz/${quiz.id}`}
                className="flex items-center gap-2 bg-gray-50 text-black font-bold uppercase tracking-wider font-mono px-6 py-2 rounded hover:bg-gray-100 transition-colors text-sm"
              >
                <Play className="h-4 w-4" />
                Start Quiz
              </a>
            ) : (
              <a
                href="/sign-in"
                className="flex items-center gap-2 bg-gray-50 text-neutral-500 font-bold uppercase tracking-wider font-mono px-6 py-2 rounded hover:bg-gray-50 transition-colors text-sm"
              >
                <Lock className="h-4 w-4" />
                Sign in to Start
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
