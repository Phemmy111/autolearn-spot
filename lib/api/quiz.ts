import { Quiz, QuizSubmission, LeaderboardEntry, QuizHistoryEntry } from '@/types/quiz'

const BASE_URL = 'https://n8n-wj6g.onrender.com/webhook'

export async function fetchCurrentQuiz(): Promise<Quiz | null> {
  try {
    const res = await fetch(`${BASE_URL}/quiz/current`, { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed to fetch current quiz')
    return await res.json()
  } catch (error) {
    console.error('Error fetching current quiz:', error)
    return null
  }
}

export async function submitQuiz(submission: QuizSubmission): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/quiz/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
    })
    if (!res.ok) throw new Error('Failed to submit quiz')
    return true
  } catch (error) {
    console.error('Error submitting quiz:', error)
    return false
  }
}

export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const res = await fetch(`${BASE_URL}/leaderboard/current`, { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed to fetch leaderboard')
    return await res.json()
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return []
  }
}

export async function fetchQuizHistory(studentId: string): Promise<QuizHistoryEntry[]> {
  try {
    const res = await fetch(`${BASE_URL}/student/history?studentId=${encodeURIComponent(studentId)}`, { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed to fetch quiz history')
    return await res.json()
  } catch (error) {
    console.error('Error fetching quiz history:', error)
    return []
  }
}
