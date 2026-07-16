import { Quiz, QuizSubmission, LeaderboardEntry, QuizHistoryEntry } from '@/types/quiz'
import { mockQuiz } from '@/data/quiz'

const BASE_URL = 'https://n8n-wj6g.onrender.com/webhook'

export async function fetchCurrentQuiz(): Promise<Quiz | null> {
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800))
    return mockQuiz
  } catch (error) {
    console.error('Error fetching current quiz:', error)
    return null
  }
}

export async function submitQuiz(submission: QuizSubmission): Promise<boolean> {
  try {
    // Simulate network processing delay for submit
    await new Promise(resolve => setTimeout(resolve, 2000))
    console.log('Mock submitted:', submission)
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
