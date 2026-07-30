import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentCohortId } from '@/lib/progress-service'
import type {
  CohortAnalytics,
  EngagementMetrics,
  PerformanceDistribution,
  StudentListEntry,
} from './types'

/**
 * Get comprehensive cohort analytics for administrators
 */
export async function getCohortAnalytics(
  cohortId?: string
): Promise<CohortAnalytics> {
  const cid = cohortId || (await getCurrentCohortId())

  // Get total students in cohort
  const { count: totalStudents } = await supabaseAdmin
    .from('enrollments')
    .select('id', { count: 'exact', head: true })
    .eq('cohort_id', cid)
    .eq('status', 'active')

  // Get engagement metrics
  const engagementMetrics = await calculateEngagementMetrics(cid)

  // Get performance distribution
  const performanceDistribution = await calculatePerformanceDistribution(cid)

  // Calculate average progress
  const averageProgress = await calculateAverageProgress(cid)

  // Calculate completion rate
  const completionRate = await calculateCompletionRate(cid)

  // Calculate active students (last 7 days)
  const activeStudents = await calculateActiveStudents(cid, 7)

  return {
    cohortId: cid,
    totalStudents: totalStudents || 0,
    activeStudents,
    engagementMetrics,
    performanceDistribution,
    averageProgress,
    completionRate,
  }
}

/**
 * Calculate engagement metrics for a cohort
 */
async function calculateEngagementMetrics(
  cohortId: string
): Promise<EngagementMetrics> {
  // Active students in last 7 days
  const { count: active7d } = await supabaseAdmin
    .from('login_activity')
    .select('user_id', { count: 'exact', head: true })
    .eq('cohort_id', cohortId)
    .gte('login_time', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

  // Active students in last 30 days
  const { count: active30d } = await supabaseAdmin
    .from('login_activity')
    .select('user_id', { count: 'exact', head: true })
    .eq('cohort_id', cohortId)
    .gte('login_time', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

  // Average session duration
  const { data: sessions } = await supabaseAdmin
    .from('login_activity')
    .select('session_duration_seconds')
    .eq('cohort_id', cohortId)
    .not('session_duration_seconds', 'is', null)
    .gte('login_time', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

  const averageSessionDuration =
    sessions && sessions.length > 0
      ? Math.round(
          sessions.reduce((sum, s) => sum + (s.session_duration_seconds || 0), 0) /
            sessions.length
        )
      : 0

  // Average login frequency (logins per active user per week)
  const { count: totalLogins30d } = await supabaseAdmin
    .from('login_activity')
    .select('id', { count: 'exact', head: true })
    .eq('cohort_id', cohortId)
    .gte('login_time', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

  const averageLoginFrequency =
    active30d && active30d > 0 ? Math.round((totalLogins30d || 0) / active30d / 4) : 0

  // Course completion rate
  const completionRate = await calculateCompletionRate(cohortId)

  return {
    activeStudents7d: active7d || 0,
    activeStudents30d: active30d || 0,
    averageSessionDuration,
    averageLoginFrequency,
    courseCompletionRate: completionRate,
  }
}

/**
 * Calculate performance distribution for a cohort
 */
async function calculatePerformanceDistribution(
  cohortId: string
): Promise<PerformanceDistribution> {
  // Get all scores from leaderboard
  const { data: scores, error } = await supabaseAdmin
    .from('leaderboard')
    .select('total_score, user_id, user_name')
    .eq('cohort_id', cohortId)
    .order('total_score', { ascending: false })

  if (error) {
    console.error('[cohort-analytics] calculatePerformanceDistribution error:', error)
    return {
      scoreRanges: [],
      averageScore: 0,
      medianScore: 0,
      topPerformers: [],
      atRiskStudents: [],
    }
  }

  const scoreList = (scores || []).map((s) => s.total_score)
  const total = scoreList.length

  // Calculate score ranges
  const ranges = [
    { range: '90-100', min: 90, max: 100 },
    { range: '80-89', min: 80, max: 89 },
    { range: '70-79', min: 70, max: 79 },
    { range: '60-69', min: 60, max: 69 },
    { range: '50-59', min: 50, max: 59 },
    { range: '0-49', min: 0, max: 49 },
  ]

  const scoreRanges = ranges.map((r) => {
    const count = scoreList.filter((s) => s >= r.min && s <= r.max).length
    return {
      range: r.range,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }
  })

  // Calculate average score
  const averageScore =
    total > 0 ? Math.round(scoreList.reduce((sum, s) => sum + s, 0) / total) : 0

  // Calculate median score
  const sortedScores = [...scoreList].sort((a, b) => a - b)
  const medianScore =
    total > 0
      ? total % 2 === 0
        ? (sortedScores[total / 2 - 1] + sortedScores[total / 2]) / 2
        : sortedScores[Math.floor(total / 2)]
      : 0

  // Top performers (top 10)
  const topPerformers = (scores || [])
    .slice(0, 10)
    .map((s) => ({
      userId: s.user_id,
      userName: s.user_name || 'Anonymous',
      score: s.total_score,
    }))

  // At-risk students (bottom 20% with low progress)
  const atRiskStudents = await getAtRiskStudents(cohortId)

  return {
    scoreRanges,
    averageScore,
    medianScore,
    topPerformers,
    atRiskStudents,
  }
}

/**
 * Get at-risk students (low progress, inactive)
 */
async function getAtRiskStudents(
  cohortId: string
): Promise<{ userId: string; userName: string; progressPercentage: number; lastActivity: string }[]> {
  // Get students with low progress (<50%)
  const { data: enrollments } = await supabaseAdmin
    .from('enrollments')
    .select('user_id, clerk_user_id, email')
    .eq('cohort_id', cohortId)
    .eq('status', 'active')

  if (!enrollments || enrollments.length === 0) {
    return []
  }

  const atRiskStudents = []

  for (const enrollment of enrollments) {
    const userId = enrollment.clerk_user_id || enrollment.email

    // Get lesson progress
    const { count: completedLessons } = await supabaseAdmin
      .from('lesson_progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('cohort_id', cohortId)
      .eq('completed', true)

    const { count: totalLessons } = await supabaseAdmin
      .from('lessons')
      .select('id', { count: 'exact', head: true })
      .eq('cohort_id', cohortId)

    const progressPercentage =
      totalLessons && totalLessons > 0
        ? Math.round(((completedLessons || 0) / totalLessons) * 100)
        : 0

    // Get last activity
    const { data: lastActivity } = await supabaseAdmin
      .from('login_activity')
      .select('login_time')
      .eq('user_id', userId)
      .order('login_time', { ascending: false })
      .limit(1)
      .single()

    const lastActivityDate = lastActivity?.login_time || null
    const daysSinceActivity = lastActivityDate
      ? Math.floor((Date.now() - new Date(lastActivityDate).getTime()) / (1000 * 60 * 60 * 24))
      : 999

    // At-risk if progress < 50% and inactive for >7 days
    if (progressPercentage < 50 && daysSinceActivity > 7) {
      atRiskStudents.push({
        userId,
        userName: enrollment.email,
        progressPercentage,
        lastActivity: lastActivityDate || 'Never',
      })
    }
  }

  return atRiskStudents.slice(0, 20) // Limit to top 20 at-risk students
}

/**
 * Calculate average progress for a cohort
 */
async function calculateAverageProgress(cohortId: string): Promise<number> {
  const { data: enrollments } = await supabaseAdmin
    .from('enrollments')
    .select('clerk_user_id, email')
    .eq('cohort_id', cohortId)
    .eq('status', 'active')

  if (!enrollments || enrollments.length === 0) {
    return 0
  }

  const { count: totalLessons } = await supabaseAdmin
    .from('lessons')
    .select('id', { count: 'exact', head: true })
    .eq('cohort_id', cohortId)

  if (!totalLessons || totalLessons === 0) {
    return 0
  }

  let totalProgress = 0

  for (const enrollment of enrollments) {
    const userId = enrollment.clerk_user_id || enrollment.email

    const { count: completedLessons } = await supabaseAdmin
      .from('lesson_progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('cohort_id', cohortId)
      .eq('completed', true)

    const progressPercentage = Math.round(((completedLessons || 0) / totalLessons) * 100)
    totalProgress += progressPercentage
  }

  return Math.round(totalProgress / enrollments.length)
}

/**
 * Calculate completion rate for a cohort
 */
async function calculateCompletionRate(cohortId: string): Promise<number> {
  const { count: totalStudents } = await supabaseAdmin
    .from('enrollments')
    .select('id', { count: 'exact', head: true })
    .eq('cohort_id', cohortId)
    .eq('status', 'active')

  const { count: completedStudents } = await supabaseAdmin
    .from('certificates')
    .select('id', { count: 'exact', head: true })
    .eq('cohort_id', cohortId)

  return totalStudents && totalStudents > 0
    ? Math.round(((completedStudents || 0) / totalStudents) * 100)
    : 0
}

/**
 * Calculate active students in a time period
 */
async function calculateActiveStudents(
  cohortId: string,
  days: number
): Promise<number> {
  const { count } = await supabaseAdmin
    .from('login_activity')
    .select('user_id', { count: 'exact', head: true })
    .eq('cohort_id', cohortId)
    .gte('login_time', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())

  return count || 0
}

/**
 * Get student list with progress metrics for admin view
 */
export async function getStudentList(
  cohortId?: string,
  sortBy: 'progress' | 'score' | 'name' | 'activity' = 'progress',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<StudentListEntry[]> {
  const cid = cohortId || (await getCurrentCohortId())

  const { data: enrollments } = await supabaseAdmin
    .from('enrollments')
    .select('clerk_user_id, email, activated_at')
    .eq('cohort_id', cid)
    .eq('status', 'active')

  if (!enrollments || enrollments.length === 0) {
    return []
  }

  const { count: totalLessons } = await supabaseAdmin
    .from('lessons')
    .select('id', { count: 'exact', head: true })
    .eq('cohort_id', cid)

  const students: StudentListEntry[] = []

  for (const enrollment of enrollments) {
    const userId = enrollment.clerk_user_id || enrollment.email

    // Get lesson progress
    const { count: completedLessons } = await supabaseAdmin
      .from('lesson_progress')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('cohort_id', cid)
      .eq('completed', true)

    const progressPercentage =
      totalLessons && totalLessons > 0
        ? Math.round(((completedLessons || 0) / totalLessons) * 100)
        : 0

    // Get total score
    const { data: leaderboardEntry } = await supabaseAdmin
      .from('leaderboard')
      .select('total_score')
      .eq('user_id', userId)
      .eq('cohort_id', cid)
      .single()

    // Get last activity
    const { data: lastActivity } = await supabaseAdmin
      .from('login_activity')
      .select('login_time')
      .eq('user_id', userId)
      .order('login_time', { ascending: false })
      .limit(1)
      .single()

    // Determine status
    let status: StudentListEntry['status'] = 'active'
    if (progressPercentage >= 100) {
      status = 'completed'
    } else if (lastActivity?.login_time) {
      const daysSinceActivity = Math.floor(
        (Date.now() - new Date(lastActivity.login_time).getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysSinceActivity > 14) {
        status = 'inactive'
      }
    }

    students.push({
      userId,
      userName: enrollment.email,
      email: enrollment.email,
      progressPercentage,
      totalScore: leaderboardEntry?.total_score || 0,
      lastActivityAt: lastActivity?.login_time || null,
      status,
    })
  }

  // Sort
  const sortKey = sortBy === 'progress' ? 'progressPercentage' :
                  sortBy === 'score' ? 'totalScore' :
                  sortBy === 'name' ? 'userName' : 'lastActivityAt'

  students.sort((a, b) => {
    const aVal = a[sortKey as keyof StudentListEntry]
    const bVal = b[sortKey as keyof StudentListEntry]
    
    if (sortOrder === 'desc') {
      return aVal > bVal ? 1 : -1
    }
    return aVal < bVal ? 1 : -1
  })

  return students
}
