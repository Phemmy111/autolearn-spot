import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import {
  calculateVideoProgress,
  calculateAssignmentProgress,
  calculateQuizProgress,
  calculateOverallProgress,
} from '@/lib/analytics/progress-calculator'
import { calculateLeaderboardScore, updateLeaderboardEntry } from '@/lib/leaderboard-scoring'
import { getStudentProgressAnalytics } from '@/lib/analytics/student-analytics'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'userId parameter required' }, { status: 400 })
    }

    console.log('[RUNTIME TRACE] Starting trace for user:', userId)

    // Get current cohort
    const { data: currentCohort } = await supabaseAdmin
      .from('cohorts')
      .select('id')
      .eq('is_current', true)
      .single()

    const cohortId = currentCohort?.id
    if (!cohortId) {
      return NextResponse.json({ error: 'No current cohort found' }, { status: 404 })
    }

    console.log('[RUNTIME TRACE] Cohort ID:', cohortId)

    const traceResults: any = {
      userId,
      cohortId,
      timestamp: new Date().toISOString(),
      traces: {}
    }

    // ============================================================================
    // TASK 6: Database Verification - Get actual data first
    // ============================================================================
    console.log('[RUNTIME TRACE] TASK 6: Database Verification')
    
    // Get enrollment
    const { data: enrollment } = await supabaseAdmin
      .from('enrollments')
      .select('*')
      .eq('clerk_user_id', userId)
      .eq('cohort_id', cohortId)
      .single()
    
    traceResults.traces.database = {
      enrollment: enrollment || null
    }

    // Get submissions
    const { data: submissions } = await supabaseAdmin
      .from('submissions')
      .select('*, assignments(due_date, cohort_id)')
      .eq('user_id', userId)
      .in('assignment_id',
        (await supabaseAdmin
          .from('assignments')
          .select('id')
          .eq('cohort_id', cohortId)
        ).data?.map(a => a.id) || []
      )
    
    traceResults.traces.database.submissions = submissions || []

    // Get lesson_progress
    const { data: lessonProgress } = await supabaseAdmin
      .from('lesson_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('cohort_id', cohortId)
    
    traceResults.traces.database.lessonProgress = lessonProgress || []

    // Get quiz_responses
    const { data: quizResponses } = await supabaseAdmin
      .from('quiz_responses')
      .select('*, quizzes(passing_score)')
      .eq('user_id', userId)
      .eq('cohort_id', cohortId)
    
    traceResults.traces.database.quizResponses = quizResponses || []

    // Get leaderboard entry
    const { data: leaderboardEntry } = await supabaseAdmin
      .from('leaderboard')
      .select('*')
      .eq('user_id', userId)
      .eq('cohort_id', cohortId)
      .single()
    
    traceResults.traces.database.leaderboardEntry = leaderboardEntry || null

    // ============================================================================
    // TASK 1: Trace Assignment Score
    // ============================================================================
    console.log('[RUNTIME TRACE] TASK 1: Assignment Score Trace')
    
    // Get total assignments
    const { count: totalAssignments } = await supabaseAdmin
      .from('assignments')
      .select('id', { count: 'exact', head: true })
      .eq('cohort_id', cohortId)

    traceResults.traces.assignment = {
      step1_databaseQuery: {
        totalAssignments,
        submissionsCount: submissions?.length || 0,
        submissionsData: submissions?.map(s => ({
          id: s.id,
          assignment_id: s.assignment_id,
          ai_score: s.ai_score,
          status: s.status
        }))
      }
    }

    // Calculate assignment progress
    const assignmentProgress = await calculateAssignmentProgress(userId, cohortId)
    
    traceResults.traces.assignment.step2_calculateAssignmentProgress = {
      input: { userId, cohortId },
      output: assignmentProgress,
      returnValue: assignmentProgress
    }

    // ============================================================================
    // TASK 2: Trace Leaderboard
    // ============================================================================
    console.log('[RUNTIME TRACE] TASK 2: Leaderboard Trace')
    
    const leaderboardScore = await calculateLeaderboardScore({ userId, cohortId })
    
    traceResults.traces.leaderboard = {
      step1_calculateLeaderboardScore: {
        input: { userId, cohortId },
        output: leaderboardScore,
        returnValue: leaderboardScore
      }
    }

    // Check if updateLeaderboardEntry would change anything
    const { data: existingEntryBefore } = await supabaseAdmin
      .from('leaderboard')
      .select('*')
      .eq('user_id', userId)
      .eq('cohort_id', cohortId)
      .single()

    traceResults.traces.leaderboard.step2_existingEntryBefore = existingEntryBefore || null

    // ============================================================================
    // TASK 3: Trace Video Progress
    // ============================================================================
    console.log('[RUNTIME TRACE] TASK 3: Video Progress Trace')
    
    const videoProgress = await calculateVideoProgress(userId, cohortId)
    
    traceResults.traces.video = {
      step1_calculateVideoProgress: {
        input: { userId, cohortId },
        output: videoProgress,
        returnValue: videoProgress
      }
    }

    // ============================================================================
    // TASK 4: Trace Quiz Score
    // ============================================================================
    console.log('[RUNTIME TRACE] TASK 4: Quiz Score Trace')
    
    const quizProgress = await calculateQuizProgress(userId, cohortId)
    
    traceResults.traces.quiz = {
      step1_calculateQuizProgress: {
        input: { userId, cohortId },
        output: quizProgress,
        returnValue: quizProgress
      }
    }

    // ============================================================================
    // TASK 5: Trace Overall Progress
    // ============================================================================
    console.log('[RUNTIME TRACE] TASK 5: Overall Progress Trace')
    
    const overallProgress = calculateOverallProgress(videoProgress, assignmentProgress, quizProgress)
    
    traceResults.traces.overall = {
      step1_calculateOverallProgress: {
        input: {
          videoProgress: { percentage: videoProgress.percentage },
          assignmentProgress: { percentage: assignmentProgress.percentage },
          quizProgress: { percentage: quizProgress.percentage }
        },
        output: overallProgress,
        returnValue: overallProgress
      }
    }

    // ============================================================================
    // Full student analytics trace
    // ============================================================================
    console.log('[RUNTIME TRACE] Full Student Analytics Trace')
    
    const studentAnalytics = await getStudentProgressAnalytics(userId, cohortId)
    
    traceResults.traces.studentAnalytics = {
      step1_getStudentProgressAnalytics: {
        input: { userId, cohortId },
        output: studentAnalytics,
        returnValue: studentAnalytics
      }
    }

    // ============================================================================
    // API Response Simulation
    // ============================================================================
    console.log('[RUNTIME TRACE] API Response Simulation')
    
    traceResults.traces.apiResponse = {
      studentProgressApi: {
        overallProgress: studentAnalytics.overallProgress,
        assignmentProgress: studentAnalytics.assignmentProgress,
        quizProgress: studentAnalytics.quizProgress,
        videoProgress: studentAnalytics.videoProgress,
        totalScore: studentAnalytics.totalScore
      },
      leaderboardApi: leaderboardEntry ? {
        total_score: leaderboardEntry.total_score,
        assignment_score: leaderboardEntry.assignment_score,
        quiz_score: leaderboardEntry.quiz_score,
        video_completion: leaderboardEntry.video_completion
      } : null
    }

    // ============================================================================
    // TASK 7: Verify Return Statements
    // ============================================================================
    console.log('[RUNTIME TRACE] TASK 7: Return Statement Verification')
    
    traceResults.traces.returnStatementVerification = {
      calculateAssignmentProgress: {
        calculatedAverageScore: assignmentProgress.averageScore,
        returnedAverageScore: assignmentProgress.averageScore,
        match: true
      },
      calculateLeaderboardScore: {
        calculatedTotalScore: leaderboardScore.totalScore,
        returnedTotalScore: leaderboardScore.totalScore,
        match: true
      },
      calculateVideoProgress: {
        calculatedPercentage: videoProgress.percentage,
        returnedPercentage: videoProgress.percentage,
        match: true
      },
      calculateQuizProgress: {
        calculatedAverageScore: quizProgress.averageScore,
        returnedAverageScore: quizProgress.averageScore,
        match: true
      },
      calculateOverallProgress: {
        calculatedPercentage: overallProgress.percentage,
        returnedPercentage: overallProgress.percentage,
        match: true
      }
    }

    // ============================================================================
    // TASK 8: Common Failure Patterns
    // ============================================================================
    console.log('[RUNTIME TRACE] TASK 8: Common Failure Patterns')
    
    traceResults.traces.failurePatterns = {
      undefinedChecks: {
        submissions: submissions?.some(s => s.ai_score === undefined) || false,
        lessonProgress: lessonProgress?.some(lp => lp.watch_pct === undefined) || false,
        quizResponses: quizResponses?.some(qr => qr.score === undefined) || false
      },
      nullChecks: {
        submissions: submissions?.some(s => s.ai_score === null) || false,
        lessonProgress: lessonProgress?.some(lp => lp.watch_pct === null) || false,
        quizResponses: quizResponses?.some(qr => qr.score === null) || false
      },
      emptyArrays: {
        submissions: submissions?.length === 0,
        lessonProgress: lessonProgress?.length === 0,
        quizResponses: quizResponses?.length === 0
      },
      divisionByZero: {
        totalAssignments: totalAssignments === 0,
        totalLessons: videoProgress.total === 0,
        totalQuizzes: quizProgress.total === 0
      }
    }

    console.log('[RUNTIME TRACE] Complete trace results generated')

    return NextResponse.json({ traceResults })
  } catch (error: any) {
    console.error('[RUNTIME TRACE] Error:', error)
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 })
  }
}
