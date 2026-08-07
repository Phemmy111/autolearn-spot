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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]" />
      </div>
    )
  }

  if (quizzes.length === 0) {
    return (
      <div className="text-center py-12 border border-[var(--border-default)] bg-[var(--card)] rounded-xl shadow-sm">
        <BookOpen className="h-12 w-12 text-[var(--text-muted)] mx-auto mb-4" />
        <p className="font-mono text-sm text-[var(--text-muted)]">No quizzes available yet. Check back soon!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {quizzes.map((quiz) => (
        <div
          key={quiz.id}
          className="group border border-[var(--border-default)] bg-[var(--card)] p-6 rounded-xl transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:border-[var(--primary)] shadow-sm"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 bg-[var(--primary-light)] text-[var(--primary)] font-mono text-xs rounded">
                  {quiz.phase}
                </span>
                <span className="px-2 py-1 bg-[var(--surface-hover)] text-[var(--text-muted)] font-mono text-xs rounded">
                  Week {quiz.week_number}
                </span>
              </div>
              <h3 className="font-heading text-xl font-bold text-[var(--text-primary)] mb-2">{quiz.title}</h3>
              {quiz.description && (
                <p className="font-mono text-sm text-[var(--text-body)]">{quiz.description}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mb-4 font-mono text-xs text-[var(--text-muted)]">
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
                className="flex items-center gap-2 bg-[var(--primary)] text-white font-bold uppercase tracking-wider font-mono px-6 py-2 rounded hover:bg-[var(--primary-hover)] transition-colors text-sm"
              >
                <Play className="h-4 w-4" />
                Start Quiz
              </a>
            ) : (
              <a
                href="/sign-in"
                className="flex items-center gap-2 bg-[var(--surface-hover)] text-[var(--text-muted)] font-bold uppercase tracking-wider font-mono px-6 py-2 rounded hover:bg-[var(--border-default)] transition-colors text-sm"
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
