// Legacy types for backward compatibility (deprecated)
export interface QuizQuestion {
  number: number
  type: string
  question: string
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
  type: string
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

// Supabase schema types (current implementation)
export interface SupabaseQuiz {
  id: string
  title: string
  description: string | null
  week_number: number
  phase: string
  time_limit: number | null
  passing_score: number
  created_at: string
  updated_at: string
  is_active: boolean
}

export interface SupabaseQuestion {
  id: string
  quiz_id: string
  question_text: string
  question_type: 'multiple_choice' | 'true_false' | 'short_answer'
  options: string[] | null
  correct_answer: string
  explanation: string | null
  points: number
  order_index: number
  created_at: string
}

export interface SupabaseQuizResponse {
  id: string
  quiz_id: string
  user_id: string
  user_name: string | null
  user_email: string | null
  answers: Record<string, string>
  score: number
  total_points: number
  percentage: number
  passed: boolean
  time_taken: number | null
  started_at: string | null
  completed_at: string
  created_at: string
}

export interface SupabaseLeaderboard {
  id: string
  user_id: string
  user_name: string
  user_email: string | null
  total_score: number
  quizzes_completed: number
  quizzes_passed: number
  average_score: number
  last_activity: string
  created_at: string
  updated_at: string
}
