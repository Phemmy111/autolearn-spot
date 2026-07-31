import { supabaseAdmin } from '@/lib/supabase'
import type {
  VideoProgress,
  AssignmentProgress,
  QuizProgress,
  OverallProgress,
  CertificateStatus,
} from './types'

/**
 * Calculate video progress metrics for a student
 */
export async function calculateVideoProgress(
  userId: string,
  cohortId: string
): Promise<VideoProgress> {
  // Get total lessons in cohort
  const { count: totalLessons } = await supabaseAdmin
    .from('lessons')
    .select('id', { count: 'exact', head: true })
    .eq('cohort_id', cohortId)

  // Get completed lessons for user
  const { data: completedLessons, error } = await supabaseAdmin
    .from('lesson_progress')
    .select('watch_pct, updated_at')
    .eq('user_id', userId)
    .eq('cohort_id', cohortId)
    .eq('completed', true)

  if (error) {
    console.error('[progress-calculator] calculateVideoProgress error:', error)
    return {
      completed: 0,
      total: totalLessons || 0,
      percentage: 0,
      averageWatchPct: 0,
      lastActivityAt: null,
    }
  }

  const completed = completedLessons?.length || 0
  const total = totalLessons || 0
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

  // Calculate average watch percentage
  const averageWatchPct =
    completedLessons && completedLessons.length > 0
      ? Math.round(
          completedLessons.reduce((sum, lp) => sum + (lp.watch_pct || 0), 0) /
            completedLessons.length
        )
      : 0

  // Get last activity
  const lastActivityAt =
    completedLessons && completedLessons.length > 0
      ? completedLessons.reduce((latest, lp) => {
          return !latest || new Date(lp.updated_at) > new Date(latest.updated_at)
            ? lp.updated_at
            : latest
        }, completedLessons[0].updated_at)
      : null

  return {
    completed,
    total,
    percentage,
    averageWatchPct,
    lastActivityAt,
  }
}

/**
 * Calculate assignment progress metrics for a student
 */
export async function calculateAssignmentProgress(
  userId: string,
  cohortId: string
): Promise<AssignmentProgress> {
  // Get total assignments in cohort
  const { count: totalAssignments } = await supabaseAdmin
    .from('assignments')
    .select('id', { count: 'exact', head: true })
    .eq('cohort_id', cohortId)

  // Get submissions for user
  const { data: submissions, error } = await supabaseAdmin
    .from('submissions')
    .select('ai_score, status, created_at, assignments(due_date)')
    .eq('user_id', userId)
    .in('assignment_id', 
      // Get assignment IDs for this cohort
      (await supabaseAdmin
        .from('assignments')
        .select('id')
        .eq('cohort_id', cohortId)
      ).data?.map(a => a.id) || []
    )

  if (error) {
    console.error('[progress-calculator] calculateAssignmentProgress error:', error)
    return {
      submitted: 0,
      total: totalAssignments || 0,
      percentage: 0,
      averageScore: 0,
      onTimeRate: 0,
      pendingReview: 0,
      approved: 0,
      needsRevision: 0,
      lastSubmissionAt: null,
    }
  }

  const submitted = submissions?.length || 0
  const total = totalAssignments || 0
  const percentage = total > 0 ? Math.round((submitted / total) * 100) : 0

  // Calculate average score
  const scoredSubmissions = submissions?.filter(s => s.ai_score !== null) || []
  const averageScore =
    scoredSubmissions.length > 0
      ? Math.round(
          scoredSubmissions.reduce((sum, s) => sum + (s.ai_score || 0), 0) /
            scoredSubmissions.length
        )
      : 0

  // Calculate on-time submission rate
  const onTimeSubmissions =
    submissions?.filter(s => {
      if (!s.assignments?.due_date) return true // No due date means always on time
      return new Date(s.created_at) <= new Date(s.assignments.due_date)
    }).length || 0
  const onTimeRate = submitted > 0 ? Math.round((onTimeSubmissions / submitted) * 100) : 0

  // Count by status
  const pendingReview = submissions?.filter(s => s.status === 'submitted').length || 0
  const approved = submissions?.filter(s => s.status === 'approved').length || 0
  const needsRevision = submissions?.filter(s => s.status === 'needs_revision').length || 0

  // Get last submission
  const lastSubmissionAt =
    submissions && submissions.length > 0
      ? submissions.reduce((latest, s) => {
          return !latest || new Date(s.created_at) > new Date(latest.created_at)
            ? s.created_at
            : latest
        }, submissions[0].created_at)
      : null

  return {
    submitted,
    total,
    percentage,
    averageScore,
    onTimeRate,
    pendingReview,
    approved,
    needsRevision,
    lastSubmissionAt,
  }
}

/**
 * Calculate quiz progress metrics for a student
 */
export async function calculateQuizProgress(
  userId: string,
  cohortId: string
): Promise<QuizProgress> {
  // Get total quizzes in cohort
  const { count: totalQuizzes } = await supabaseAdmin
    .from('quizzes')
    .select('id', { count: 'exact', head: true })
    .eq('cohort_id', cohortId)
    .eq('is_active', true)

  console.log('[progress-calculator] calculateQuizProgress - totalQuizzes:', totalQuizzes, 'cohortId:', cohortId)

  // Get quiz responses for user
  const { data: responses, error } = await supabaseAdmin
    .from('quiz_responses')
    .select('quiz_id, score, created_at, quizzes(passing_score)')
    .eq('user_id', userId)
    .eq('cohort_id', cohortId)

  console.log('[progress-calculator] calculateQuizProgress - responses:', responses?.length, 'error:', error)

  if (error) {
    console.error('[progress-calculator] calculateQuizProgress error:', error)
    return {
      completed: 0,
      total: totalQuizzes || 0,
      averageScore: 0,
      passRate: 0,
      passed: 0,
      lastQuizAt: null,
    }
  }

  // Get unique quizzes attempted
  const uniqueQuizzes = new Map()
  responses?.forEach(r => {
    if (!uniqueQuizzes.has(r.quiz_id) || new Date(r.created_at) > new Date(uniqueQuizzes.get(r.quiz_id).created_at)) {
      uniqueQuizzes.set(r.quiz_id, r)
    }
  })

  const completed = uniqueQuizzes.size
  const total = totalQuizzes || 0
  
  // Fix: ensure percentage is calculated even if total is 0
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

  // Calculate average score (best attempt per quiz)
  const scores = Array.from(uniqueQuizzes.values()).map(r => r.score)
  const averageScore =
    scores.length > 0
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : 0

  // Calculate pass rate
  const passed = Array.from(uniqueQuizzes.values()).filter(r => {
    const passingScore = r.quizzes?.passing_score || 70
    return r.score >= passingScore
  }).length
  const passRate = completed > 0 ? Math.round((passed / completed) * 100) : 0

  // Get last quiz
  const lastQuizAt =
    responses && responses.length > 0
      ? responses.reduce((latest, r) => {
          return !latest || new Date(r.created_at) > new Date(latest.created_at)
            ? r.created_at
            : latest
        }, responses[0].created_at)
      : null

  return {
    completed,
    total,
    percentage,
    averageScore,
    passRate,
    passed,
    lastQuizAt,
  }
}

/**
 * Calculate overall progress status
 */
export function calculateOverallProgress(
  videoProgress: VideoProgress,
  assignmentProgress: AssignmentProgress,
  quizProgress: QuizProgress
): OverallProgress {
  // Weighted calculation: 40% video, 35% assignments, 25% quizzes
  const videoWeight = 0.4
  const assignmentWeight = 0.35
  const quizWeight = 0.25

  const weightedPercentage =
    (videoProgress.percentage * videoWeight) +
    (assignmentProgress.percentage * assignmentWeight) +
    (quizProgress.percentage * quizWeight)

  // Ensure percentage is a number, not a string
  const percentage = Math.round(Number(weightedPercentage) || 0)

  // Determine status
  let status: OverallProgress['status'] = 'on_track'
  if (percentage >= 100) {
    status = 'completed'
  } else if (percentage < 50) {
    status = 'behind'
  } else if (percentage > 80) {
    status = 'ahead'
  }

  // Estimate completion date (simple heuristic)
  let estimatedCompletionDate: string | null = null
  if (percentage > 0 && percentage < 100) {
    // Assume linear progress based on current rate
    // This is a simplified calculation - could be enhanced with historical data
    const daysSinceStart = 30 // Placeholder - would use actual enrollment date
    const daysRemaining = Math.round((daysSinceStart / percentage) * (100 - percentage))
    const estimatedDate = new Date()
    estimatedDate.setDate(estimatedDate.getDate() + daysRemaining)
    estimatedCompletionDate = estimatedDate.toISOString()
  }

  return {
    percentage,
    status,
    estimatedCompletionDate,
  }
}

/**
 * Calculate certificate status
 */
export async function calculateCertificateStatus(
  userId: string,
  cohortId: string
): Promise<CertificateStatus> {
  // Check if certificate exists
  const { data: certificate, error } = await supabaseAdmin
    .from('certificates')
    .select('issued_at')
    .eq('user_id', userId)
    .eq('cohort_id', cohortId)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 is "not found", which is expected
    console.error('[progress-calculator] calculateCertificateStatus error:', error)
  }

  if (certificate) {
    return {
      eligible: true,
      issued: true,
      issuedAt: certificate.issued_at,
    }
  }

  // Check eligibility: 100% video progress, all assignments approved, all quizzes passed
  const [videoProgress, assignmentProgress, quizProgress] = await Promise.all([
    calculateVideoProgress(userId, cohortId),
    calculateAssignmentProgress(userId, cohortId),
    calculateQuizProgress(userId, cohortId),
  ])

  const eligible =
    videoProgress.percentage >= 100 &&
    assignmentProgress.approved === assignmentProgress.total &&
    quizProgress.passed === quizProgress.total

  return {
    eligible,
    issued: false,
    issuedAt: null,
  }
}
