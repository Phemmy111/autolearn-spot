export const COHORT_1_ID = 'a1111111-1111-1111-1111-111111111111'

export type CohortStatus = 'draft' | 'active' | 'archived'
export type EnrollmentStatus = 'pending' | 'active' | 'revoked'
export type SubmissionType = 'screenshot' | 'url' | 'both'
export type SubmissionStatus = 'submitted' | 'approved' | 'needs_revision'
export type ReleaseDay = 'monday' | 'wednesday' | 'friday'
export type QuizDay = 'tuesday' | 'thursday' | 'saturday'

export interface CohortScheduleSettings {
  video_release_days: ReleaseDay[]
  quiz_days: QuizDay[]
  live_day: 'saturday'
  live_time: string
  timezone: string
}

export interface CertificateRules {
  min_video_completion_pct: number
  require_all_quizzes_passed: boolean
  require_all_assignments_approved: boolean
}

export interface CohortSettings {
  schedule?: CohortScheduleSettings
  certificate_rules?: CertificateRules
  referral_commission_ngn?: number
}

export interface Cohort {
  id: string
  name: string
  slug: string
  price_ngn: number | null
  status: CohortStatus
  start_date: string | null
  end_date: string | null
  is_current: boolean
  timezone: string
  settings: CohortSettings
  created_at: string
  updated_at: string
}

export interface LessonResource {
  label: string
  url: string
}

export interface Lesson {
  id: string
  cohort_id: string
  title: string
  description: string | null
  vdo_cipher_video_id: string | null
  vimeo_video_id: string | null
  available_at: string
  duration_label: string | null
  week_number: number
  session_number: number
  release_day: ReleaseDay
  resources: LessonResource[]
  order_index: number
  created_at?: string
  updated_at?: string
}

/** Shape used by existing dashboard/video components */
export interface VideoCourse {
  id: string
  title: string
  description: string
  vdoCipherVideoId?: string
  vimeoVideoId?: string
  availableAt: string
  duration: string
  week: number
  resources?: LessonResource[]
  cohortId?: string
  sessionNumber?: number
  releaseDay?: ReleaseDay
}

export interface Enrollment {
  id: string
  cohort_id: string
  email: string
  clerk_user_id: string | null
  payment_ref: string | null
  amount_paid: number | null
  status: EnrollmentStatus
  referral_code: string | null
  referred_by_code: string | null
  invited_at: string | null
  activated_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface LessonProgress {
  id: string
  cohort_id: string
  lesson_id: string
  user_id: string
  completed: boolean
  watch_pct: number
  last_position_seconds: number
  completed_at: string | null
  created_at: string
  updated_at: string
}
