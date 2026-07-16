export interface QuizQuestion {
  number: number
  type: 'MCQ' | 'OPEN_ENDED'
  questionText: string
  options?: string[]
}

export interface Quiz {
  week: number
  title: string
  description: string
  duration: number // in minutes
  passMark: number
  questions: QuizQuestion[]
}

export interface QuizAnswer {
  number: number
  type: 'MCQ' | 'OPEN_ENDED'
  answer: string
}

export interface QuizSubmission {
  studentId: string
  name: string
  email: string
  week: number
  startedAt: string
  submittedAt: string
  answers: QuizAnswer[]
}

export interface LeaderboardEntry {
  rank: number
  studentId: string
  name: string
  score: number
  percentage: number
}

export interface QuizHistoryEntry {
  week: number
  score: number
  percentage: number
  status: string
  submittedAt: string
}
