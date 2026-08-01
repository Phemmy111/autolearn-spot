import { supabaseAdmin } from '@/lib/supabase'

/**
 * Leaderboard Scoring Configuration
 * 
 * Scoring Formula:
 * - 40% Assignment Performance (average assignment score)
 * - 40% Quiz Performance (average quiz score) 
 * - 15% Video Completion (percentage of videos completed)
 * - 5% Certificate Bonus (fixed bonus if certificate earned)
 * 
 * Alternative Point-Based System:
 * - Assignment: score earned (0-100 per assignment)
 * - Quiz: score earned (0-100 per quiz)
 * - Video completion: +2 points per completed lesson
 * - Course completion/certificate: +50 bonus points
 */

export interface LeaderboardScoreBreakdown {
  assignmentScore: number
  quizScore: number
  videoScore: number
  certificateBonus: number
  totalScore: number
}

export interface LeaderboardCalculationParams {
  userId: string
  cohortId: string
}

/**
 * Calculate comprehensive leaderboard score for a student
 */
export async function calculateLeaderboardScore(
  params: LeaderboardCalculationParams
): Promise<LeaderboardScoreBreakdown> {
  const { userId, cohortId } = params

  console.log('[calculateLeaderboardScore] Starting calculation for:', { userId, cohortId })

  // 1. Get assignment performance (40% weight) - only count approved assignments
  const assignmentResult = await supabaseAdmin
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
    .eq('status', 'approved')
    .not('ai_score', 'is', null)

  const assignmentScores = assignmentResult.data?.map(s => s.ai_score || 0) || []
  const averageAssignmentScore = assignmentScores.length > 0
    ? assignmentScores.reduce((sum, score) => sum + score, 0) / assignmentScores.length
    : 0
  const assignmentContribution = averageAssignmentScore * 0.4

  console.log('[calculateLeaderboardScore] Assignment:', {
    scores: assignmentScores,
    average: averageAssignmentScore,
    contribution: assignmentContribution
  })

  // 2. Get quiz performance (40% weight) - only count passed quizzes
  const quizResult = await supabaseAdmin
    .from('quiz_responses')
    .select('score, quiz_id, percentage, quizzes(passing_score)')
    .eq('user_id', userId)
    .eq('cohort_id', cohortId)

  // Get best score per quiz
  const quizBestScores = new Map<string, { score: number; passed: boolean }>()
  quizResult.data?.forEach(r => {
    const passingScore = r.quizzes?.passing_score || 70
    const passed = r.percentage >= passingScore
    const existing = quizBestScores.get(r.quiz_id)
    if (!existing || r.score > existing.score) {
      quizBestScores.set(r.quiz_id, { score: r.score, passed })
    }
  })

  // Only count passed quizzes for average
  const passedQuizScores = Array.from(quizBestScores.values())
    .filter(q => q.passed)
    .map(q => q.score)
  
  const averageQuizScore = passedQuizScores.length > 0
    ? passedQuizScores.reduce((sum, score) => sum + score, 0) / passedQuizScores.length
    : 0
  const quizContribution = averageQuizScore * 0.4

  console.log('[calculateLeaderboardScore] Quiz:', {
    scores: quizScores,
    average: averageQuizScore,
    contribution: quizContribution
  })

  // 3. Get video completion (15% weight)
  const { count: totalLessons } = await supabaseAdmin
    .from('lessons')
    .select('id', { count: 'exact', head: true })
    .eq('cohort_id', cohortId)

  const { data: completedLessons } = await supabaseAdmin
    .from('lesson_progress')
    .select('id')
    .eq('user_id', userId)
    .eq('cohort_id', cohortId)
    .eq('completed', true)

  const videoCompletionRate = totalLessons && totalLessons > 0
    ? (completedLessons?.length || 0) / totalLessons
    : 0
  const videoContribution = videoCompletionRate * 100 * 0.15

  console.log('[calculateLeaderboardScore] Video:', {
    totalLessons,
    completed: completedLessons?.length || 0,
    rate: videoCompletionRate,
    contribution: videoContribution
  })

  // 4. Certificate bonus (5% weight - fixed 5 points if earned)
  const { data: certificate } = await supabaseAdmin
    .from('certificates')
    .select('id')
    .eq('user_id', userId)
    .eq('cohort_id', cohortId)
    .single()

  const certificateBonus = certificate ? 5 : 0

  console.log('[calculateLeaderboardScore] Certificate:', {
    hasCertificate: !!certificate,
    bonus: certificateBonus
  })

  // Calculate total score
  const totalScore = assignmentContribution + quizContribution + videoContribution + certificateBonus

  console.log('[calculateLeaderboardScore] Total:', {
    assignmentContribution,
    quizContribution,
    videoContribution,
    certificateBonus,
    totalScore
  })

  return {
    assignmentScore: Math.round(averageAssignmentScore),
    quizScore: Math.round(averageQuizScore),
    videoScore: Math.round(videoCompletionRate * 100),
    certificateBonus,
    totalScore: Math.round(totalScore)
  }
}

/**
 * Update leaderboard entry for a student
 */
export async function updateLeaderboardEntry(
  userId: string,
  cohortId: string
): Promise<void> {
  const scoreBreakdown = await calculateLeaderboardScore({ userId, cohortId })

  // Get user name and email from enrollments (prefer full_name, fallback to email prefix)
  const { data: enrollment } = await supabaseAdmin
    .from('enrollments')
    .select('email, full_name, first_name, last_name')
    .eq('clerk_user_id', userId)
    .eq('cohort_id', cohortId)
    .single()

  const userName = enrollment?.full_name || 
                    (enrollment?.first_name && enrollment?.last_name ? `${enrollment.first_name} ${enrollment.last_name}` : null) ||
                    enrollment?.email?.split('@')[0] || 
                    'Anonymous'
  
  const userEmail = enrollment?.email || null

  // Check if entry exists for this user+cohort
  const { data: existingEntry } = await supabaseAdmin
    .from('leaderboard')
    .select('id')
    .eq('user_id', userId)
    .eq('cohort_id', cohortId)
    .single()

  if (existingEntry) {
    // Update existing entry
    await supabaseAdmin
      .from('leaderboard')
      .update({
        total_score: scoreBreakdown.totalScore,
        average_score: (scoreBreakdown.assignmentScore + scoreBreakdown.quizScore) / 2,
        assignment_score: scoreBreakdown.assignmentScore,
        quiz_score: scoreBreakdown.quizScore,
        video_completion: scoreBreakdown.videoScore,
        certificate_bonus: scoreBreakdown.certificateBonus,
        user_name: userName,
        user_email: userEmail,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingEntry.id)
  } else {
    // Create new entry
    await supabaseAdmin
      .from('leaderboard')
      .insert({
        user_id: userId,
        cohort_id: cohortId,
        total_score: scoreBreakdown.totalScore,
        average_score: (scoreBreakdown.assignmentScore + scoreBreakdown.quizScore) / 2,
        assignment_score: scoreBreakdown.assignmentScore,
        quiz_score: scoreBreakdown.quizScore,
        video_completion: scoreBreakdown.videoScore,
        certificate_bonus: scoreBreakdown.certificateBonus,
        user_name: userName,
        user_email: userEmail,
        rank: null // Will be calculated by a separate function
      })
  }
}

/**
 * Recalculate all leaderboard entries for a cohort
 */
export async function recalculateCohortLeaderboard(cohortId: string): Promise<void> {
  // Get all enrolled students
  const { data: enrollments } = await supabaseAdmin
    .from('enrollments')
    .select('clerk_user_id')
    .eq('cohort_id', cohortId)
    .eq('status', 'active')

  if (!enrollments || enrollments.length === 0) {
    console.log(`[leaderboard-scoring] No active enrollments for cohort ${cohortId}`)
    return
  }

  // Update each student's leaderboard entry
  for (const enrollment of enrollments) {
    if (enrollment.clerk_user_id) {
      try {
        await updateLeaderboardEntry(enrollment.clerk_user_id, cohortId)
      } catch (error) {
        console.error(`[leaderboard-scoring] Error updating leaderboard for user ${enrollment.clerk_user_id}:`, error)
      }
    }
  }

  // Update ranks after all scores are calculated
  await updateLeaderboardRanks(cohortId)
}

/**
 * Update leaderboard ranks based on total scores
 */
export async function updateLeaderboardRanks(cohortId: string): Promise<void> {
  const { data: entries } = await supabaseAdmin
    .from('leaderboard')
    .select('id, total_score')
    .eq('cohort_id', cohortId)
    .order('total_score', { ascending: false })

  if (!entries || entries.length === 0) {
    return
  }

  // Update ranks
  for (let i = 0; i < entries.length; i++) {
    await supabaseAdmin
      .from('leaderboard')
      .update({ rank: i + 1 })
      .eq('id', entries[i].id)
  }
}

/**
 * Trigger leaderboard recalculation after specific events
 */
export async function triggerLeaderboardUpdate(
  userId: string,
  eventType: 'assignment' | 'quiz' | 'video' | 'certificate'
): Promise<void> {
  try {
    // Get current cohort for user
    const { data: enrollment } = await supabaseAdmin
      .from('enrollments')
      .select('cohort_id')
      .eq('clerk_user_id', userId)
      .eq('status', 'active')
      .single()

    if (!enrollment?.cohort_id) {
      console.log(`[leaderboard-scoring] No active cohort found for user ${userId}`)
      return
    }

    // Update the specific user's leaderboard entry
    await updateLeaderboardEntry(userId, enrollment.cohort_id)

    // Update ranks to ensure correct ordering
    await updateLeaderboardRanks(enrollment.cohort_id)

    console.log(`[leaderboard-scoring] Updated leaderboard for user ${userId} after ${eventType} event`)
  } catch (error) {
    console.error(`[leaderboard-scoring] Error triggering leaderboard update:`, error)
  }
}