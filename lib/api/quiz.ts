import { SupabaseQuiz, SupabaseQuestion, SupabaseLeaderboard } from '@/types/quiz'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Fetch all available quizzes
export async function fetchQuizzes(): Promise<SupabaseQuiz[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/quizzes`, { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed to fetch quizzes')
    const data = await res.json()
    return data.quizzes || []
  } catch (error) {
    console.error('Error fetching quizzes:', error)
    return []
  }
}

// Fetch a specific quiz with its questions
export async function fetchQuizById(quizId: string, preview = false): Promise<{ quiz: SupabaseQuiz; questions: SupabaseQuestion[] } | null> {
  try {
    const url = `${BASE_URL}/api/quizzes/${quizId}${preview ? '?preview=true' : ''}`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed to fetch quiz')
    return await res.json()
  } catch (error) {
    console.error('Error fetching quiz:', error)
    return null
  }
}

// Submit quiz to Supabase
export async function submitQuiz(quizId: string, submission: {
  user_name: string
  user_email: string
  answers: Record<string, string>
  time_taken: number
  started_at: string
}): Promise<{ success: boolean; score?: number; percentage?: number; passed?: boolean; error?: string }> {
  try {
    const res = await fetch(`${BASE_URL}/api/quizzes/${quizId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
    })
    
    if (!res.ok) {
      const error = await res.json()
      return { success: false, error: error.error || 'Failed to submit quiz' }
    }
    
    const data = await res.json()
    return {
      success: true,
      score: data.score,
      percentage: data.percentage,
      passed: data.passed,
    }
  } catch (error) {
    console.error('Error submitting quiz:', error)
    return { success: false, error: 'Network error' }
  }
}

export async function fetchLeaderboard(): Promise<SupabaseLeaderboard[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/leaderboard`, { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed to fetch leaderboard')
    const data = await res.json()
    return data.leaderboard || []
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return []
  }
}
