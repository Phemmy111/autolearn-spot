import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase'
import {
  calculateVideoProgress,
  calculateAssignmentProgress,
  calculateQuizProgress,
  calculateOverallProgress,
} from '@/lib/analytics/progress-calculator'
import { calculateLeaderboardScore } from '@/lib/leaderboard-scoring'
import { getCurrentCohortId } from '@/lib/progress-service'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const failures: any[] = []

  // Helper to record failures
  const recordFailure = (section: string, error: any, details?: any) => {
    failures.push({
      section,
      error: error.message || String(error),
      stack: error.stack,
      details,
      timestamp: new Date().toISOString()
    })
    console.error(`[Runtime Debug] ${section} failed:`, error)
  }

  // Wrap requireAdmin to expose the error
  try {
    await requireAdmin()
  } catch (error) {
    recordFailure('requireAdmin', error)
    return NextResponse.json({ 
      success: false, 
      failures
    }, { status: 500 })
  }

  // Wrap URL parsing to expose the error
  let url: URL
  let userId: string | null = null
  try {
    url = new URL(request.url)
    userId = url.searchParams.get('userId')
  } catch (error) {
    recordFailure('URL Parsing', error)
    return NextResponse.json({ 
      success: false, 
      failures
    }, { status: 500 })
  }

  if (!userId) {
    return NextResponse.json({ error: 'userId parameter required' }, { status: 400 })
  }

  try {
    let cohortId: string | null = null
    try {
      cohortId = await getCurrentCohortId()
    } catch (error) {
      recordFailure('getCurrentCohortId', error)
      cohortId = null
    }

    const runtimeData: any = {
      userId,
      cohortId,
      timestamp: new Date().toISOString(),
      sections: {}
    }

    // SECTION 1: Student Information
    try {
      const { data: enrollment } = await supabaseAdmin
        .from('enrollments')
        .select('*')
        .eq('clerk_user_id', userId)
        .eq('cohort_id', cohortId)
        .single()
      runtimeData.sections.studentInfo = enrollment
    } catch (error) {
      recordFailure('Student Information', error)
      runtimeData.sections.studentInfo = null
    }

    // SECTION 2: Assignment Runtime Trace
    let submissions: any = null
    try {
      const result = await supabaseAdmin
        .from('submissions')
        .select('*, assignments(due_date, title, cohort_id)')
        .eq('user_id', userId)
        .in('assignment_id',
          (await supabaseAdmin
            .from('assignments')
            .select('id')
            .eq('cohort_id', cohortId)
          ).data?.map(a => a.id) || []
        )
      submissions = result.data
    } catch (error) {
      recordFailure('Assignment Database Query', error)
      submissions = null
    }

    // Intermediate calculation stages for assignments
    const scoredSubmissions = submissions?.filter(s => s.ai_score !== null) || []
    const mappedScores = scoredSubmissions.map(s => s.ai_score || 0)
    const averageScore = mappedScores.length > 0
      ? mappedScores.reduce((sum, score) => sum + score, 0) / mappedScores.length
      : 0

    let assignmentProgressResult: any = null
    try {
      assignmentProgressResult = await calculateAssignmentProgress(userId, cohortId)
    } catch (error) {
      recordFailure('calculateAssignmentProgress', error)
    }

    runtimeData.sections.assignmentRuntime = {
      databaseRows: submissions,
      calculationStages: {
        input: { userId, cohortId },
        nullFilter: {
          inputRows: submissions?.length || 0,
          afterFilter: scoredSubmissions.length,
          filteredRows: scoredSubmissions
        },
        mappedScores: {
          scores: mappedScores
        },
        average: {
          calculated: averageScore
        },
        functionOutput: assignmentProgressResult
      }
    }

    // SECTION 3: Lesson Runtime Trace
    let lessonProgress: any = null
    try {
      const result = await supabaseAdmin
        .from('lesson_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('cohort_id', cohortId)
      lessonProgress = result.data
    } catch (error) {
      recordFailure('Lesson Database Query', error)
    }

    const completedLessons = lessonProgress?.filter(lp => lp.completed) || []
    let totalLessons = 0
    try {
      const totalLessonsResult = await supabaseAdmin
        .from('lessons')
        .select('id', { count: 'exact', head: true })
        .eq('cohort_id', cohortId)
      totalLessons = totalLessonsResult.count || 0
    } catch (error) {
      recordFailure('Lessons Count Query', error)
    }
    const completionRate = totalLessons > 0 ? (completedLessons.length / totalLessons) * 100 : 0

    let videoProgressResult: any = null
    try {
      videoProgressResult = await calculateVideoProgress(userId, cohortId)
    } catch (error) {
      recordFailure('calculateVideoProgress', error)
    }

    runtimeData.sections.lessonRuntime = {
      databaseRows: lessonProgress,
      calculationStages: {
        input: { userId, cohortId },
        completedLessons: {
          count: completedLessons.length,
          lessons: completedLessons
        },
        completionRate: {
          totalLessons,
          completedLessons: completedLessons.length,
          rate: completionRate
        },
        functionOutput: videoProgressResult
      }
    }

    // SECTION 4: Quiz Runtime Trace
    let quizResponses: any = null
    try {
      const result = await supabaseAdmin
        .from('quiz_responses')
        .select('*, quizzes(passing_score, title)')
        .eq('user_id', userId)
        .eq('cohort_id', cohortId)
      quizResponses = result.data
    } catch (error) {
      recordFailure('Quiz Database Query', error)
    }

    // Best score selection logic
    const quizBestScores = new Map()
    quizResponses?.forEach(r => {
      const existing = quizBestScores.get(r.quiz_id)
      if (!existing || r.score > existing.score) {
        quizBestScores.set(r.quiz_id, r)
      }
    })

    const bestScoresArray = Array.from(quizBestScores.values())
    const quizAverage = bestScoresArray.length > 0
      ? bestScoresArray.reduce((sum, r) => sum + r.score, 0) / bestScoresArray.length
      : 0

    let quizProgressResult: any = null
    try {
      quizProgressResult = await calculateQuizProgress(userId, cohortId)
    } catch (error) {
      recordFailure('calculateQuizProgress', error)
    }

    runtimeData.sections.quizRuntime = {
      databaseRows: quizResponses,
      calculationStages: {
        input: { userId, cohortId },
        bestScoreSelection: {
          totalResponses: quizResponses?.length || 0,
          uniqueQuizzes: quizBestScores.size,
          bestScores: bestScoresArray
        },
        average: {
          calculated: quizAverage
        },
        functionOutput: quizProgressResult
      }
    }

    // SECTION 5: Overall Progress
    const videoWeight = 0.40
    const assignmentWeight = 0.35
    const quizWeight = 0.25

    const videoContribution = (videoProgressResult?.percentage || 0) * videoWeight
    const assignmentContribution = (assignmentProgressResult?.percentage || 0) * assignmentWeight
    const quizContribution = (quizProgressResult?.percentage || 0) * quizWeight
    const calculatedOverall = videoContribution + assignmentContribution + quizContribution

    let overallProgressResult: any = null
    try {
      overallProgressResult = calculateOverallProgress(videoProgressResult, assignmentProgressResult, quizProgressResult)
    } catch (error) {
      recordFailure('calculateOverallProgress', error)
    }

    runtimeData.sections.overallProgress = {
      inputValues: {
        videoPercentage: videoProgressResult?.percentage,
        assignmentPercentage: assignmentProgressResult?.percentage,
        quizPercentage: quizProgressResult?.percentage
      },
      calculationStages: {
        weightedFormula: {
          video: {
            percentage: videoProgressResult?.percentage,
            weight: videoWeight,
            contribution: videoContribution
          },
          assignment: {
            percentage: assignmentProgressResult?.percentage,
            weight: assignmentWeight,
            contribution: assignmentContribution
          },
          quiz: {
            percentage: quizProgressResult?.percentage,
            weight: quizWeight,
            contribution: quizContribution
          },
          total: calculatedOverall
        },
        functionOutput: overallProgressResult
      }
    }

    // SECTION 6: Leaderboard Runtime
    let leaderboardScoreResult: any = null
    try {
      leaderboardScoreResult = await calculateLeaderboardScore({ userId, cohortId })
    } catch (error) {
      recordFailure('calculateLeaderboardScore', error)
    }

    runtimeData.sections.leaderboardRuntime = {
      calculationStages: {
        input: { userId, cohortId },
        assignmentContribution: leaderboardScoreResult?.assignmentScore,
        quizContribution: leaderboardScoreResult?.quizScore,
        videoContribution: leaderboardScoreResult?.videoScore,
        certificateBonus: leaderboardScoreResult?.certificateBonus,
        totalScore: leaderboardScoreResult?.totalScore,
        functionOutput: leaderboardScoreResult
      }
    }

    // SECTION 7: Leaderboard Database
    let leaderboardEntry: any = null
    try {
      const result = await supabaseAdmin
        .from('leaderboard')
        .select('*')
        .eq('user_id', userId)
        .eq('cohort_id', cohortId)
        .single()
      leaderboardEntry = result.data
    } catch (error) {
      recordFailure('Leaderboard Database Query', error)
    }

    runtimeData.sections.leaderboardTable = leaderboardEntry

    // SECTION 8: Analytics API Comparison (called AFTER calculations)
    let analyticsApiData = null
    let analyticsApiStatus = 0
    let analyticsApiOk = false
    let analyticsApiError = null
    
    try {
      const analyticsApiCall = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/analytics/student/progress`, {
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('cookie') || ''
        }
      })

      analyticsApiStatus = analyticsApiCall.status
      analyticsApiOk = analyticsApiCall.ok
      
      if (analyticsApiCall.ok) {
        analyticsApiData = await analyticsApiCall.json()
      } else {
        const errorText = await analyticsApiCall.text()
        analyticsApiError = { status: analyticsApiStatus, body: errorText }
        recordFailure('Analytics API', new Error(`HTTP ${analyticsApiStatus}: ${errorText}`), analyticsApiError)
      }
    } catch (error) {
      recordFailure('Analytics API Fetch', error)
    }

    runtimeData.sections.analyticsApi = {
      status: analyticsApiStatus,
      ok: analyticsApiOk,
      data: analyticsApiData,
      error: analyticsApiError
    }

    // SECTION 9: Leaderboard API Comparison (called AFTER calculations)
    let leaderboardApiData = null
    let leaderboardApiStatus = 0
    let leaderboardApiOk = false
    let leaderboardApiError = null
    
    try {
      const leaderboardApiCall = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/leaderboard`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      leaderboardApiStatus = leaderboardApiCall.status
      leaderboardApiOk = leaderboardApiCall.ok
      
      if (leaderboardApiCall.ok) {
        leaderboardApiData = await leaderboardApiCall.json()
      } else {
        const errorText = await leaderboardApiCall.text()
        leaderboardApiError = { status: leaderboardApiStatus, body: errorText }
        recordFailure('Leaderboard API', new Error(`HTTP ${leaderboardApiStatus}: ${errorText}`), leaderboardApiError)
      }
    } catch (error) {
      recordFailure('Leaderboard API Fetch', error)
    }

    runtimeData.sections.leaderboardApi = {
      status: leaderboardApiStatus,
      ok: leaderboardApiOk,
      data: leaderboardApiData,
      error: leaderboardApiError
    }

    // SECTION 10: Pipeline Verification (continue all pipelines even if failures)
    const pipelineVerification: any = {
      stages: [],
      failures: []
    }

    // Only add stages if values are available
    if (assignmentProgressResult) {
      pipelineVerification.stages.push({
        pipeline: 'Assignment',
        stage: 'calculateAssignmentProgress',
        value: assignmentProgressResult.averageScore
      })
    }

    if (videoProgressResult) {
      pipelineVerification.stages.push({
        pipeline: 'Video',
        stage: 'calculateVideoProgress',
        value: videoProgressResult.percentage
      })
    }

    if (quizProgressResult) {
      pipelineVerification.stages.push({
        pipeline: 'Quiz',
        stage: 'calculateQuizProgress',
        value: quizProgressResult.averageScore
      })
    }

    if (overallProgressResult) {
      pipelineVerification.stages.push({
        pipeline: 'Overall',
        stage: 'calculateOverallProgress',
        value: overallProgressResult.percentage
      })
    }

    if (leaderboardScoreResult) {
      pipelineVerification.stages.push({
        pipeline: 'Leaderboard',
        stage: 'calculateLeaderboardScore',
        value: leaderboardScoreResult.totalScore
      })
    }

    if (leaderboardEntry) {
      pipelineVerification.stages.push({
        pipeline: 'Leaderboard',
        stage: 'Database',
        value: leaderboardEntry.total_score
      })
    }

    runtimeData.sections.pipelineVerification = pipelineVerification

    // SECTION 11: Failures
    runtimeData.sections.failures = failures

    // Return response
    if (failures.length > 0) {
      return NextResponse.json({
        success: false,
        failures,
        runtime: runtimeData
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      failures: [],
      runtime: runtimeData
    })
  } catch (error: any) {
    console.error('[GET /api/admin/debug/runtime] Error:', error)
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
    }
    return NextResponse.json({ 
      success: false, 
      error: error.message, 
      stack: error.stack 
    }, { status: 500 })
  }
}
