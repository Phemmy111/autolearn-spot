import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentCohortId } from '@/lib/progress-service'
import {
  calculateAssignmentProgress,
  calculateVideoProgress,
  calculateQuizProgress,
  calculateOverallProgress,
} from '@/lib/analytics/progress-calculator'
import { calculateLeaderboardScore } from '@/lib/leaderboard-scoring'

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

  // Initialize runtime data structure early
  const runtimeData: any = {
    userId: null,
    cohortId: null,
    timestamp: new Date().toISOString(),
    sections: {}
  }

  // Wrap requireAdmin to expose the error
  try {
    await requireAdmin()
  } catch (error) {
    recordFailure('requireAdmin', error)
    return NextResponse.json({ 
      success: false, 
      failures,
      runtime: { ...runtimeData, timestamp: new Date().toISOString() }
    }, { status: 500 })
  }

  // Wrap URL parsing to expose the error
  let url: URL
  let userId: string | null = null
  try {
    url = new URL(request.url)
    userId = url.searchParams.get('userId')
    runtimeData.userId = userId
  } catch (error) {
    recordFailure('URL Parsing', error)
    return NextResponse.json({ 
      success: false, 
      failures,
      runtime: { ...runtimeData, timestamp: new Date().toISOString() }
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

    runtimeData.cohortId = cohortId

    // SECTION 1: Student Information
    try {
      if (cohortId) {
        const { data: enrollment } = await supabaseAdmin
          .from('enrollments')
          .select('*')
          .eq('clerk_user_id', userId)
          .eq('cohort_id', cohortId)
          .single()
        runtimeData.sections.studentInfo = enrollment
      } else {
        runtimeData.sections.studentInfo = null
        recordFailure('Student Information', new Error('No cohort ID available'))
      }
    } catch (error) {
      recordFailure('Student Information', error)
      runtimeData.sections.studentInfo = null
    }

    // SECTION 2: Assignment Runtime Trace
    let submissions: any = null
    try {
      if (cohortId) {
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
      } else {
        recordFailure('Assignment Database Query', new Error('No cohort ID available'))
        submissions = null
      }
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
      if (cohortId) {
        assignmentProgressResult = await calculateAssignmentProgress(userId, cohortId)
      } else {
        recordFailure('calculateAssignmentProgress', new Error('No cohort ID available'))
      }
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
      if (cohortId) {
        const result = await supabaseAdmin
          .from('lesson_progress')
          .select('*')
          .eq('user_id', userId)
          .eq('cohort_id', cohortId)
        lessonProgress = result.data
      } else {
        recordFailure('Lesson Database Query', new Error('No cohort ID available'))
      }
    } catch (error) {
      recordFailure('Lesson Database Query', error)
    }

    const completedLessons = lessonProgress?.filter(lp => lp.completed) || []
    let totalLessons = 0
    try {
      if (cohortId) {
        const totalLessonsResult = await supabaseAdmin
          .from('lessons')
          .select('id', { count: 'exact', head: true })
          .eq('cohort_id', cohortId)
        totalLessons = totalLessonsResult.count || 0
      } else {
        recordFailure('Lessons Count Query', new Error('No cohort ID available'))
      }
    } catch (error) {
      recordFailure('Lessons Count Query', error)
    }
    const completionRate = totalLessons > 0 ? (completedLessons.length / totalLessons) * 100 : 0

    let videoProgressResult: any = null
    try {
      if (cohortId) {
        videoProgressResult = await calculateVideoProgress(userId, cohortId)
      } else {
        recordFailure('calculateVideoProgress', new Error('No cohort ID available'))
      }
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
      if (cohortId) {
        const result = await supabaseAdmin
          .from('quiz_responses')
          .select('*, quizzes(passing_score, title)')
          .eq('user_id', userId)
          .eq('cohort_id', cohortId)
        quizResponses = result.data
      } else {
        recordFailure('Quiz Database Query', new Error('No cohort ID available'))
      }
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
      if (cohortId) {
        quizProgressResult = await calculateQuizProgress(userId, cohortId)
      } else {
        recordFailure('calculateQuizProgress', new Error('No cohort ID available'))
      }
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
      if (cohortId) {
        leaderboardScoreResult = await calculateLeaderboardScore({ userId, cohortId })
      } else {
        recordFailure('calculateLeaderboardScore', new Error('No cohort ID available'))
      }
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
      if (cohortId) {
        const result = await supabaseAdmin
          .from('leaderboard')
          .select('*')
          .eq('user_id', userId)
          .eq('cohort_id', cohortId)
          .single()
        leaderboardEntry = result.data
      } else {
        recordFailure('Leaderboard Database Query', new Error('No cohort ID available'))
      }
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
          Authorization: request.headers.get('Authorization') || '',
        },
      })
      analyticsApiStatus = analyticsApiCall.status
      analyticsApiOk = analyticsApiCall.ok
      if (analyticsApiOk) {
        analyticsApiData = await analyticsApiCall.json()
      } else {
        analyticsApiError = await analyticsApiCall.text()
      }
    } catch (error) {
      recordFailure('Analytics API Call', error)
      analyticsApiError = error.message
    }

    runtimeData.sections.analyticsApiComparison = {
      status: analyticsApiStatus,
      ok: analyticsApiOk,
      error: analyticsApiError,
      data: analyticsApiData
    }

    return NextResponse.json({
      success: true,
      runtime: runtimeData,
      failures
    })
  } catch (error: any) {
    recordFailure('Overall Process', error)
    return NextResponse.json({
      success: false,
      failures,
      runtime: runtimeData
    }, { status: 500 })
  }
}
