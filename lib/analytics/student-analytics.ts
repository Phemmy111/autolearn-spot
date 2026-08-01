import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentCohortId } from '@/lib/progress-service'
import {
  calculateVideoProgress,
  calculateAssignmentProgress,
  calculateQuizProgress,
  calculateOverallProgress,
  calculateCertificateStatus,
} from './progress-calculator'
import type {
  StudentProgressAnalytics,
  AssignmentPerformance,
  QuizPerformance,
  LoginActivity,
} from './types'

/**
 * Get comprehensive student progress analytics
 */
export async function getStudentProgressAnalytics(
  userId: string,
  cohortId?: string
): Promise<StudentProgressAnalytics> {
  const cid = cohortId || (await getCurrentCohortId())

  // Calculate all progress metrics in parallel
  const [videoProgress, assignmentProgress, quizProgress, certificate] =
    await Promise.all([
      calculateVideoProgress(userId, cid),
      calculateAssignmentProgress(userId, cid),
      calculateQuizProgress(userId, cid),
      calculateCertificateStatus(userId, cid),
    ])

  const overallProgress = calculateOverallProgress(
    videoProgress,
    assignmentProgress,
    quizProgress
  )

  // Get total score from leaderboard
  const { data: leaderboardEntry } = await supabaseAdmin
    .from('leaderboard')
    .select('total_score')
    .eq('user_id', userId)
    .eq('cohort_id', cid)
    .single()

  const totalScore = leaderboardEntry?.total_score || 0

  // Get last activity across all activities
  const lastActivityAt = [
    videoProgress.lastActivityAt,
    assignmentProgress.lastSubmissionAt,
    quizProgress.lastQuizAt,
  ].filter(Boolean).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] || null

  return {
    overallProgress,
    videoProgress,
    assignmentProgress,
    quizProgress,
    certificate,
    totalScore,
    lastActivityAt,
  }
}

/**
 * Get detailed assignment performance for a student
 */
export async function getStudentAssignmentPerformance(
  userId: string,
  cohortId?: string
): Promise<AssignmentPerformance[]> {
  const cid = cohortId || (await getCurrentCohortId())

  const { data: submissions, error } = await supabaseAdmin
    .from('submissions')
    .select(`
      id,
      assignment_id,
      created_at,
      ai_score,
      status,
      ai_feedback,
      assignments (
        id,
        title,
        week_number,
        due_date
      )
    `)
    .eq('user_id', userId)
    .in('assignment_id',
      (await supabaseAdmin
        .from('assignments')
        .select('id')
        .eq('cohort_id', cid)
      ).data?.map(a => a.id) || []
    )
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[student-analytics] getStudentAssignmentPerformance error:', error)
    return []
  }

  return (submissions || []).map((s: { assignment_id: string; assignments?: { title: string; week_number: number; due_date: string }; created_at: string; ai_score: number | null; status: string; ai_feedback: string | null }) => ({
    assignmentId: s.assignment_id,
    title: s.assignments?.title || 'Unknown Assignment',
    weekNumber: s.assignments?.week_number || 0,
    submittedAt: s.created_at,
    score: s.ai_score,
    status: s.status,
    feedback: s.ai_feedback,
    isLate: s.assignments?.due_date
      ? new Date(s.created_at) > new Date(s.assignments.due_date)
      : false,
  }))
}

/**
 * Get detailed quiz performance for a student
 */
export async function getStudentQuizPerformance(
  userId: string,
  cohortId?: string
): Promise<QuizPerformance[]> {
  const cid = cohortId || (await getCurrentCohortId())

  const { data: responses, error } = await supabaseAdmin
    .from('quiz_responses')
    .select(`
      id,
      quiz_id,
      created_at,
      score,
      passed,
      quizzes (
        id,
        title,
        week_number,
        passing_score
      )
    `)
    .eq('user_id', userId)
    .eq('cohort_id', cid)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[student-analytics] getStudentQuizPerformance error:', error)
    return []
  }

  // Get best attempt per quiz
  const bestAttempts = new Map()
  ;(responses || []).forEach((r: { quiz_id: string; score: number; passed: boolean }) => {
    const existing = bestAttempts.get(r.quiz_id)
    // Only track if passed, and get the best score among passed attempts
    if (r.passed) {
      if (!existing || r.score > existing.score) {
        bestAttempts.set(r.quiz_id, r)
      }
    }
  })

  return Array.from(bestAttempts.values()).map((r: { quiz_id: string; quizzes?: { title: string; week_number: number; passing_score: number }; created_at: string; score: number; passed: boolean }) => ({
    quizId: r.quiz_id,
    title: r.quizzes?.title || 'Unknown Quiz',
    weekNumber: r.quizzes?.week_number || 0,
    attemptedAt: r.created_at,
    score: r.score,
    passed: r.passed,
    passingScore: r.quizzes?.passing_score || 70,
  }))
}

/**
 * Get login activity for a student
 */
export async function getStudentLoginActivity(
  userId: string,
  limit: number = 30
): Promise<LoginActivity[]> {
  const { data: activities, error } = await supabaseAdmin
    .from('login_activity')
    .select('login_time, session_duration_seconds, ip_address')
    .eq('user_id', userId)
    .order('login_time', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[student-analytics] getStudentLoginActivity error:', error)
    return []
  }

  return (activities || []).map((a: { login_time: string; session_duration_seconds: number | null; ip_address: string | null }) => ({
    loginTime: a.login_time,
    sessionDurationSeconds: a.session_duration_seconds,
    ipAddress: a.ip_address,
  }))
}

/**
 * Record login activity
 */
export async function recordLoginActivity(
  userId: string,
  cohortId: string | null,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    await supabaseAdmin.from('login_activity').insert({
      user_id: userId,
      cohort_id: cohortId,
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
    })
  } catch (error) {
    console.error('[student-analytics] recordLoginActivity error:', error)
    // Don't fail the login if activity recording fails
  }
}

/**
 * Update session duration for the most recent login
 */
export async function updateSessionDuration(
  userId: string,
  durationSeconds: number
): Promise<void> {
  try {
    await supabaseAdmin
      .from('login_activity')
      .update({ session_duration_seconds: durationSeconds })
      .eq('user_id', userId)
      .is('session_duration_seconds', null)
      .order('login_time', { ascending: false })
      .limit(1)
  } catch (error) {
    console.error('[student-analytics] updateSessionDuration error:', error)
  }
}
