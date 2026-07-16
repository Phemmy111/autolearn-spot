'use client'

import { useEffect, useState } from 'react'
import { useAuth, useUser } from '@clerk/nextjs'
import { Quiz } from '@/types/quiz'
import { fetchCurrentQuiz } from '@/lib/api/quiz'
import { QuizPlayer } from '@/components/quiz/QuizPlayer'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { AlertCircle } from 'lucide-react'

export default function QuizPage() {
  const { isLoaded, userId } = useAuth()
  const { user } = useUser()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadQuiz() {
      try {
        const data = await fetchCurrentQuiz()
        if (data) {
          setQuiz(data)
        } else {
          setError('No quiz is currently available.')
        }
      } catch (err) {
        setError('Failed to load the quiz. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    loadQuiz()
  }, [])

  if (!isLoaded || loading) {
    return (
      <div className="py-20">
        <LoadingSpinner message="Fetching current quiz..." />
      </div>
    )
  }

  if (error || !quiz) {
    return (
      <div className="py-20 flex justify-center">
        <div className="flex max-w-md flex-col items-center justify-center gap-4 rounded-xl border border-[#1f2229] bg-[#0c0e12] p-8 text-center shadow-xl">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <h2 className="font-heading text-xl font-bold text-white">Quiz Unavailable</h2>
          <p className="font-mono text-sm text-[#b9cacb]">{error}</p>
        </div>
      </div>
    )
  }

  if (!userId || !user) {
    return null
  }

  const userInfo = {
    id: userId,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.emailAddresses[0]?.emailAddress || '',
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <QuizPlayer quiz={quiz} user={userInfo} />
    </div>
  )
}
