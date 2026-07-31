import { supabaseAdmin } from '@/lib/supabase'
import { BADGES, Badge, UserBadge } from '@/lib/badge-definitions'

export { BADGES, Badge, UserBadge } from '@/lib/badge-definitions'

/**
 * Check and award badges for a user based on their progress
 */
export async function checkAndAwardBadges(userId: string, cohortId: string): Promise<UserBadge[]> {
  const newBadges: UserBadge[] = []

  // Get existing badges to avoid duplicates
  const { data: existingBadges } = await supabaseAdmin
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', userId)

  const existingBadgeIds = new Set(existingBadges?.map(b => b.badge_id) || [])

  // Check each badge
  for (const badge of BADGES) {
    if (existingBadgeIds.has(badge.id)) continue

    const earned = await checkBadgeCondition(badge.id, userId, cohortId)
    
    if (earned) {
      await awardBadge(userId, badge.id)
      newBadges.push({
        badge_id: badge.id,
        user_id: userId,
        earned_at: new Date().toISOString(),
        badge
      })
    }
  }

  return newBadges
}

/**
 * Check if a specific badge condition is met
 */
async function checkBadgeCondition(badgeId: string, userId: string, cohortId: string): Promise<boolean> {
  switch (badgeId) {
    case 'first_assignment':
      return await checkFirstAssignment(userId, cohortId)
    
    case 'lesson_master':
      return await checkLessonMaster(userId, cohortId)
    
    case 'fast_learner':
      return await checkFastLearner(userId, cohortId)
    
    case 'perfect_quiz':
      return await checkPerfectQuiz(userId, cohortId)
    
    case 'streak_7':
      return await checkSevenDayStreak(userId)
    
    case 'course_graduate':
      return await checkCourseGraduate(userId, cohortId)
    
    case 'quiz_master':
      return await checkQuizMaster(userId, cohortId)
    
    case 'assignment_excellence':
      return await checkAssignmentExcellence(userId, cohortId)
    
    case 'early_bird':
      return await checkEarlyBird(userId, cohortId)
    
    case 'consistent_learner':
      return await checkConsistentLearner(userId, cohortId)
    
    default:
      return false
  }
}

/**
 * Badge condition checkers
 */
async function checkFirstAssignment(userId: string, cohortId: string): Promise<boolean> {
  const { data: submissions } = await supabaseAdmin
    .from('submissions')
    .select('id')
    .eq('user_id', userId)
    .in('assignment_id',
      (await supabaseAdmin
        .from('assignments')
        .select('id')
        .eq('cohort_id', cohortId)
      ).data?.map(a => a.id) || []
    )
    .limit(1)

  return (submissions?.length || 0) > 0
}

async function checkLessonMaster(userId: string, cohortId: string): Promise<boolean> {
  const { count: totalLessons } = await supabaseAdmin
    .from('lessons')
    .select('id', { count: 'exact', head: true })
    .eq('cohort_id', cohortId)

  const { count: completedLessons } = await supabaseAdmin
    .from('lesson_progress')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('cohort_id', cohortId)
    .eq('completed', true)

  return totalLessons > 0 && completedLessons === totalLessons
}

async function checkFastLearner(userId: string, cohortId: string): Promise<boolean> {
  // Get enrollment date
  const { data: enrollment } = await supabaseAdmin
    .from('enrollments')
    .select('created_at')
    .eq('clerk_user_id', userId)
    .eq('cohort_id', cohortId)
    .single()

  if (!enrollment) return false

  const enrollmentDate = new Date(enrollment.created_at)
  const twoWeeksLater = new Date(enrollmentDate.getTime() + 14 * 24 * 60 * 60 * 1000)
  const now = new Date()

  // Check if certificate was earned within 2 weeks
  const { data: certificate } = await supabaseAdmin
    .from('certificates')
    .select('issued_at')
    .eq('user_id', userId)
    .eq('cohort_id', cohortId)
    .single()

  if (!certificate) return false

  const issueDate = new Date(certificate.issued_at)
  return issueDate <= twoWeeksLater && now >= twoWeeksLater
}

async function checkPerfectQuiz(userId: string, cohortId: string): Promise<boolean> {
  const { data: responses } = await supabaseAdmin
    .from('quiz_responses')
    .select('percentage')
    .eq('user_id', userId)
    .eq('cohort_id', cohortId)

  return responses?.some(r => r.percentage === 100) || false
}

async function checkSevenDayStreak(userId: string): Promise<boolean> {
  const { data: logins } = await supabaseAdmin
    .from('login_activity')
    .select('login_time')
    .eq('user_id', userId)
    .order('login_time', { ascending: false })
    .limit(7)

  if (!logins || logins.length < 7) return false

  // Check if the last 7 logins were on consecutive days
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < 7; i++) {
    const expectedDate = new Date(today)
    expectedDate.setDate(today.getDate() - i)
    expectedDate.setHours(0, 0, 0, 0)

    const loginDate = new Date(logins[i].login_time)
    loginDate.setHours(0, 0, 0, 0)

    if (loginDate.getTime() !== expectedDate.getTime()) {
      return false
    }
  }

  return true
}

async function checkCourseGraduate(userId: string, cohortId: string): Promise<boolean> {
  const { data: certificate } = await supabaseAdmin
    .from('certificates')
    .select('id')
    .eq('user_id', userId)
    .eq('cohort_id', cohortId)
    .single()

  return !!certificate
}

async function checkQuizMaster(userId: string, cohortId: string): Promise<boolean> {
  const { data: responses } = await supabaseAdmin
    .from('quiz_responses')
    .select('percentage, quiz_id')
    .eq('user_id', userId)
    .eq('cohort_id', cohortId)

  if (!responses || responses.length === 0) return false

  // Get best score per quiz
  const quizBestScores = new Map<string, number>()
  responses.forEach(r => {
    const existing = quizBestScores.get(r.quiz_id)
    if (!existing || r.percentage > existing) {
      quizBestScores.set(r.quiz_id, r.percentage)
    }
  })

  const scores = Array.from(quizBestScores.values())
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length

  return average >= 80
}

async function checkAssignmentExcellence(userId: string, cohortId: string): Promise<boolean> {
  const { data: submissions } = await supabaseAdmin
    .from('submissions')
    .select('ai_score')
    .eq('user_id', userId)
    .in('assignment_id',
      (await supabaseAdmin
        .from('assignments')
        .select('id')
        .eq('cohort_id', cohortId)
      ).data?.map(a => a.id) || []
    )
    .not('ai_score', 'is', null)

  if (!submissions || submissions.length === 0) return false

  const average = submissions.reduce((sum, s) => sum + (s.ai_score || 0), 0) / submissions.length
  return average >= 90
}

async function checkEarlyBird(userId: string, cohortId: string): Promise<boolean> {
  // Get enrollment date
  const { data: enrollment } = await supabaseAdmin
    .from('enrollments')
    .select('created_at')
    .eq('clerk_user_id', userId)
    .eq('cohort_id', cohortId)
    .single()

  if (!enrollment) return false

  const enrollmentDate = new Date(enrollment.created_at)
  const threeDaysLater = new Date(enrollmentDate.getTime() + 3 * 24 * 60 * 60 * 1000)

  // Check if any lessons from week 1 were completed within 3 days
  const { data: week1Lessons } = await supabaseAdmin
    .from('lessons')
    .select('id')
    .eq('cohort_id', cohortId)
    .eq('week_number', 1)

  if (!week1Lessons || week1Lessons.length === 0) return false

  const { data: completedLessons } = await supabaseAdmin
    .from('lesson_progress')
    .select('updated_at')
    .eq('user_id', userId)
    .eq('cohort_id', cohortId)
    .eq('completed', true)
    .in('lesson_id', week1Lessons.map(l => l.id))

  return completedLessons?.some(l => {
    const completedDate = new Date(l.updated_at)
    return completedDate <= threeDaysLater
  }) || false
}

async function checkConsistentLearner(userId: string, cohortId: string): Promise<boolean> {
  const { data: submissions } = await supabaseAdmin
    .from('submissions')
    .select('created_at, assignments(due_date)')
    .eq('user_id', userId)
    .in('assignment_id',
      (await supabaseAdmin
        .from('assignments')
        .select('id')
        .eq('cohort_id', cohortId)
      ).data?.map(a => a.id) || []
    )

  if (!submissions || submissions.length === 0) return false

  const onTimeCount = submissions.filter(s => {
    if (!s.assignments?.due_date) return true
    return new Date(s.created_at) <= new Date(s.assignments.due_date)
  }).length

  const onTimeRate = onTimeCount / submissions.length
  return onTimeRate >= 0.8
}

/**
 * Award a badge to a user
 */
async function awardBadge(userId: string, badgeId: string): Promise<void> {
  await supabaseAdmin
    .from('user_badges')
    .insert({
      user_id: userId,
      badge_id: badgeId,
      earned_at: new Date().toISOString()
    })
}

/**
 * Get all badges for a user
 */
export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  const { data: userBadges } = await supabaseAdmin
    .from('user_badges')
    .select('badge_id, earned_at')
    .eq('user_id', userId)

  if (!userBadges) return []

  return userBadges.map(ub => ({
    badge_id: ub.badge_id,
    user_id: userId,
    earned_at: ub.earned_at,
    badge: BADGES.find(b => b.id === ub.badge_id)!
  }))
}

/**
 * Trigger badge check after user actions
 */
export async function triggerBadgeCheck(userId: string, cohortId: string): Promise<UserBadge[]> {
  try {
    const newBadges = await checkAndAwardBadges(userId, cohortId)
    
    // Send notifications for new badges
    for (const newBadge of newBadges) {
      await sendBadgeNotification(userId, newBadge.badge)
    }

    return newBadges
  } catch (error) {
    console.error('[badge-system] Error triggering badge check:', error)
    return []
  }
}

/**
 * Send notification when a badge is earned
 */
async function sendBadgeNotification(userId: string, badge: Badge): Promise<void> {
  try {
    const { createNotification } = await import('./notifications')
    await createNotification({
      title: `🏆 Badge Earned: ${badge.name}!`,
      message: `Congratulations! You've earned the "${badge.name}" badge: ${badge.description}`,
      category: 'enrollment',
      priority: 'important',
      target_type: 'student',
      target_id: userId,
      action_url: '/dashboard',
      action_label: 'View Badges',
      send_email: true,
      event_id: `badge_earned_${badge.id}_${userId}_${Date.now()}`,
    })
    console.log(`[badge-system] Badge notification sent: ${badge.name} for user ${userId}`)
  } catch (error) {
    console.error('[badge-system] Failed to send badge notification:', error)
    // Don't fail the badge award if notification fails
  }
}