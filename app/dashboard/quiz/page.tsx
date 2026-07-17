'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function QuizPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the new quizzes page
    router.replace('/quizzes')
  }, [router])

  return null
}
