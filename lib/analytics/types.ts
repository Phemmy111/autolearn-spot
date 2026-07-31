// Analytics Service Type Definitions

export interface VideoProgress {
  completed: number
  total: number
  percentage: number
  averageWatchPct: number
  lastActivityAt: string | null
}

export interface AssignmentProgress {
  submitted: number
  total: number
  percentage: number
  averageScore: number
  onTimeRate: number
  pendingReview: number
  approved: number
  needsRevision: number
  lastSubmissionAt: string | null
}

export interface QuizProgress {
  completed: number
  total: number
  percentage: number
  averageScore: number
  passRate: number
  passed: number
  lastQuizAt: string | null
}

export interface OverallProgress {
  percentage: number
  status: 'on_track' | 'behind' | 'ahead' | 'completed'
  estimatedCompletionDate: string | null
}

export interface CertificateStatus {
  eligible: boolean
  issued: boolean
  issuedAt: string | null
}

export interface StudentProgressAnalytics {
  overallProgress: OverallProgress
  videoProgress: VideoProgress
  assignmentProgress: AssignmentProgress
  quizProgress: QuizProgress
  certificate: CertificateStatus
  totalScore: number
  lastActivityAt: string | null
}

export interface AssignmentPerformance {
  assignmentId: string
  title: string
  weekNumber: number
  submittedAt: string
  score: number | null
  status: string
  feedback: string | null
  isLate: boolean
}

export interface QuizPerformance {
  quizId: string
  title: string
  weekNumber: number
  attemptedAt: string
  score: number
  passed: boolean
  passingScore: number
}

export interface LoginActivity {
  loginTime: string
  sessionDurationSeconds: number | null
  ipAddress: string | null
}

export interface EngagementMetrics {
  activeStudents7d: number
  activeStudents30d: number
  averageSessionDuration: number
  averageLoginFrequency: number
  courseCompletionRate: number
}

export interface PerformanceDistribution {
  scoreRanges: {
    range: string
    count: number
    percentage: number
  }[]
  averageScore: number
  medianScore: number
  topPerformers: {
    userId: string
    userName: string
    score: number
  }[]
  atRiskStudents: {
    userId: string
    userName: string
    progressPercentage: number
    lastActivity: string
  }[]
}

export interface CohortAnalytics {
  cohortId: string
  totalStudents: number
  activeStudents: number
  engagementMetrics: EngagementMetrics
  performanceDistribution: PerformanceDistribution
  averageProgress: number
  completionRate: number
}

export interface StudentListEntry {
  userId: string
  userName: string
  email: string
  progressPercentage: number
  totalScore: number
  lastActivityAt: string
  status: 'active' | 'inactive' | 'completed'
}

export interface AnalyticsSnapshot {
  userId: string
  cohortId: string
  snapshotDate: string
  lessonsCompleted: number
  lessonsTotal: number
  lessonsPercentage: number
  assignmentsCompleted: number
  assignmentsTotal: number
  assignmentsPercentage: number
  quizzesCompleted: number
  quizzesTotal: number
  quizzesAverageScore: number
  overallProgress: number
  totalScore: number
}
