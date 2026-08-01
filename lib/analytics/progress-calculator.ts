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

  console.log('[calculateVideoProgress] Result:', { completed, total, percentage, averageWatchPct })

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
    .select('*')
    .eq('user_id', userId)
    .in('assignment_id', 
      // Get assignment IDs for this cohort
      (await supabaseAdmin
        .from('assignments')
        .select('id')
        .eq('cohort_id', cohortId)
      ).data?.map(a => a.id) || []
    )

  console.log('[calculateAssignmentProgress] RAW SUBMISSIONS (all fields):', JSON.stringify(submissions, null, 2))

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
  console.log('[calculateAssignmentProgress] submitted (length):', submitted)
  
  const total = totalAssignments || 0
  console.log('[calculateAssignmentProgress] total:', total)
  
  // Fix: Calculate percentage based on approved assignments, not just submitted
  const approvedCount = submissions?.filter(s => s.status === 'approved').length || 0
  console.log('[calculateAssignmentProgress] approvedCount:', approvedCount)
  console.log('[calculateAssignmentProgress] percentage formula: Math.round((approvedCount / total) * 100)', `Math.round((${approvedCount} / ${total}) * 100)`)
  const percentage = total > 0 ? Math.round((approvedCount / total) * 100) : 0
  console.log('[calculateAssignmentProgress] percentage result:', percentage)

  // Calculate average score
  const scoredSubmissions = submissions?.filter(s => s.ai_score !== null) || []
  console.log('[calculateAssignmentProgress] scoredSubmissions (ai_score !== null):', scoredSubmissions)
  console.log('[calculateAssignmentProgress] scoredSubmissions.length:', scoredSubmissions.length)
  
  const scoresArray = scoredSubmissions.map(s => s.ai_score || 0)
  console.log('[calculateAssignmentProgress] scoresArray:', scoresArray)
  
  const sumScores = scoresArray.reduce((sum, s) => sum + s, 0)
  console.log('[calculateAssignmentProgress] sumScores:', sumScores)
  
  const averageScore = scoredSubmissions.length > 0
    ? Math.round(sumScores / scoredSubmissions.length)
    : 0
  console.log('[calculateAssignmentProgress] averageScore formula:', `Math.round(${sumScores} / ${scoredSubmissions.length})`)
  console.log('[calculateAssignmentProgress] averageScore result:', averageScore)

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

  console.log('[calculateAssignmentProgress] FINAL RESULT:', { submitted, total, percentage, approvedCount, averageScore })

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
  
  // Fix: Calculate percentage based on passed quizzes, not just attempted
  const passed = Array.from(uniqueQuizzes.values()).filter(r => {
    const passingScore = r.quizzes?.passing_score || 70
    return r.score >= passingScore
  }).length
  const percentage = total > 0 ? Math.round((passed / total) * 100) : 0

  // Calculate average score (best attempt per quiz)
  const scores = Array.from(uniqueQuizzes.values()).map(r => r.score)
  const averageScore =
    scores.length > 0
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : 0

  // Calculate pass rate
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

  console.log('[calculateQuizProgress] Result:', { completed, total, percentage, passed, averageScore, passRate })

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
  console.log('[calculateOverallProgress] Input:', {
    videoProgress: { percentage: videoProgress.percentage, completed: videoProgress.completed, total: videoProgress.total },
    assignmentProgress: { percentage: assignmentProgress.percentage, submitted: assignmentProgress.submitted, total: assignmentProgress.total },
    quizProgress: { percentage: quizProgress.percentage, completed: quizProgress.completed, total: quizProgress.total }
  })

  // Count how many categories have content
  const categoriesWithContent = [
    videoProgress.total > 0,
    assignmentProgress.total > 0,
    quizProgress.total > 0
  ].filter(Boolean).length

  // If no categories have content, return 0%
  if (categoriesWithContent === 0) {
    console.log('[calculateOverallProgress] No content available, returning 0%')
    return {
      percentage: 0,
      status: 'on_track',
      estimatedCompletionDate: null,
    }
  }

  // Adjust weights based on available content
  // If only some categories have content, redistribute weights proportionally
  let videoWeight = 0.4
  let assignmentWeight = 0.35
  let quizWeight = 0.25

  if (categoriesWithContent < 3) {
    const totalOriginalWeight = videoWeight + assignmentWeight + quizWeight
    const availableWeights = []
    
    if (videoProgress.total > 0) availableWeights.push(videoWeight)
    if (assignmentProgress.total > 0) availableWeights.push(assignmentWeight)
    if (quizProgress.total > 0) availableWeights.push(quizWeight)
    
    const totalAvailableWeight = availableWeights.reduce((sum, w) => sum + w, 0)
    
    // Normalize weights to sum to 1.0
    if (videoProgress.total > 0) {
      videoWeight = (videoWeight / totalAvailableWeight)
    } else {
      videoWeight = 0
    }
    if (assignmentProgress.total > 0) {
      assignmentWeight = (assignmentWeight / totalAvailableWeight)
    } else {
      assignmentWeight = 0
    }
    if (quizProgress.total > 0) {
      quizWeight = (quizWeight / totalAvailableWeight)
    } else {
      quizWeight = 0
    }
    
    console.log('[calculateOverallProgress] Adjusted weights:', {
      videoWeight,
      assignmentWeight,
      quizWeight,
      categoriesWithContent
    })
  }

  const weightedPercentage =
    (videoProgress.percentage * videoWeight) +
    (assignmentProgress.percentage * assignmentWeight) +
    (quizProgress.percentage * quizWeight)

  // Ensure percentage is a number, not a string
  const percentage = Math.round(Number(weightedPercentage) || 0)

  console.log('[calculateOverallProgress] Calculated:', {
    videoProgress: videoProgress.percentage,
    assignmentProgress: assignmentProgress.percentage,
    quizProgress: quizProgress.percentage,
    weightedPercentage,
    finalPercentage: percentage,
    weights: { videoWeight, assignmentWeight, quizWeight }
  })

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

  console.log('[calculateCertificateStatus] Eligibility check:', {
    videoProgress: videoProgress.percentage,
    assignmentProgress: { approved: assignmentProgress.approved, total: assignmentProgress.total },
    quizProgress: { passed: quizProgress.passed, total: quizProgress.total },
    eligible
  })

  return {
    eligible,
    issued: false,
    issuedAt: null,
  }
}
