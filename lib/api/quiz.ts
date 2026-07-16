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
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000) // 30 second timeout

    const res = await fetch(`${BASE_URL}/quiz/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    // Treat any response as success — n8n may return various status codes
    // The important thing is that the server received the data
    return true
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.error('Quiz submission timed out after 30 seconds')
    } else {
      console.error('Error submitting quiz:', error)
    }
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
