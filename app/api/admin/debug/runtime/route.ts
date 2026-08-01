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
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId parameter required' }, { status: 400 })
    }

    const cohortId = await getCurrentCohortId()

    const runtimeData: any = {
      userId,
      cohortId,
      timestamp: new Date().toISOString(),
      sections: {},
      warnings: []
    }

    // Helper to add warnings
    const addWarning = (message: string, details?: any) => {
      runtimeData.warnings.push({ message, details, timestamp: new Date().toISOString() })
    }

    // SECTION 1: Student Information
    const { data: enrollment } = await supabaseAdmin
      .from('enrollments')
      .select('*')
      .eq('clerk_user_id', userId)
      .eq('cohort_id', cohortId)
      .single()

    runtimeData.sections.studentInfo = enrollment || null

    // SECTION 2: Assignment Runtime Trace
    const { data: submissions } = await supabaseAdmin
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

    // Intermediate calculation stages for assignments
    const scoredSubmissions = submissions?.filter(s => s.ai_score !== null) || []
    const mappedScores = scoredSubmissions.map(s => s.ai_score || 0)
    const averageScore = mappedScores.length > 0
      ? mappedScores.reduce((sum, score) => sum + score, 0) / mappedScores.length
      : 0

    // Check for rows disappearing
    if (submissions && submissions.length > 0 && scoredSubmissions.length === 0) {
      addWarning('Database returned submissions rows but all had null ai_score', {
        totalRows: submissions.length,
        scoredRows: scoredSubmissions.length
      })
    }

    const assignmentProgressResult = await calculateAssignmentProgress(userId, cohortId)

    // Check for calculation mismatch
    if (averageScore !== assignmentProgressResult.averageScore && averageScore !== 0) {
      addWarning('Direct calculation differs from function return', {
        directCalculation: averageScore,
        functionReturn: assignmentProgressResult.averageScore
      })
    }

    runtimeData.sections.assignmentRuntime = {
      databaseRows: submissions || [],
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
    const { data: lessonProgress } = await supabaseAdmin
      .from('lesson_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('cohort_id', cohortId)

    const completedLessons = lessonProgress?.filter(lp => lp.completed) || []
    const totalLessonsResult = await supabaseAdmin
      .from('lessons')
      .select('id', { count: 'exact', head: true })
      .eq('cohort_id', cohortId)
    const totalLessons = totalLessonsResult.count || 0
    const completionRate = totalLessons > 0 ? (completedLessons.length / totalLessons) * 100 : 0

    const videoProgressResult = await calculateVideoProgress(userId, cohortId)

    if (completionRate !== videoProgressResult.percentage && completionRate !== 0) {
      addWarning('Direct video calculation differs from function return', {
        directCalculation: completionRate,
        functionReturn: videoProgressResult.percentage
      })
    }

    runtimeData.sections.lessonRuntime = {
      databaseRows: lessonProgress || [],
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
    const { data: quizResponses } = await supabaseAdmin
      .from('quiz_responses')
      .select('*, quizzes(passing_score, title)')
      .eq('user_id', userId)
      .eq('cohort_id', cohortId)

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

    const quizProgressResult = await calculateQuizProgress(userId, cohortId)

    if (quizAverage !== quizProgressResult.averageScore && quizAverage !== 0) {
      addWarning('Direct quiz calculation differs from function return', {
        directCalculation: quizAverage,
        functionReturn: quizProgressResult.averageScore
      })
    }

    runtimeData.sections.quizRuntime = {
      databaseRows: quizResponses || [],
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

    const videoContribution = videoProgressResult.percentage * videoWeight
    const assignmentContribution = assignmentProgressResult.percentage * assignmentWeight
    const quizContribution = quizProgressResult.percentage * quizWeight
    const calculatedOverall = videoContribution + assignmentContribution + quizContribution

    const overallProgressResult = calculateOverallProgress(videoProgressResult, assignmentProgressResult, quizProgressResult)

    if (Math.round(calculatedOverall) !== overallProgressResult.percentage && calculatedOverall !== 0) {
      addWarning('Direct overall calculation differs from function return', {
        directCalculation: calculatedOverall,
        functionReturn: overallProgressResult.percentage
      })
    }

    runtimeData.sections.overallProgress = {
      inputValues: {
        videoPercentage: videoProgressResult.percentage,
        assignmentPercentage: assignmentProgressResult.percentage,
        quizPercentage: quizProgressResult.percentage
      },
      calculationStages: {
        weightedFormula: {
          video: {
            percentage: videoProgressResult.percentage,
            weight: videoWeight,
            contribution: videoContribution
          },
          assignment: {
            percentage: assignmentProgressResult.percentage,
            weight: assignmentWeight,
            contribution: assignmentContribution
          },
          quiz: {
            percentage: quizProgressResult.percentage,
            weight: quizWeight,
            contribution: quizContribution
          },
          total: calculatedOverall
        },
        functionOutput: overallProgressResult
      }
    }

    // SECTION 6: Leaderboard Runtime
    const leaderboardScoreResult = await calculateLeaderboardScore({ userId, cohortId })

    runtimeData.sections.leaderboardRuntime = {
      calculationStages: {
        input: { userId, cohortId },
        assignmentContribution: leaderboardScoreResult.assignmentScore,
        quizContribution: leaderboardScoreResult.quizScore,
        videoContribution: leaderboardScoreResult.videoScore,
        certificateBonus: leaderboardScoreResult.certificateBonus,
        totalScore: leaderboardScoreResult.totalScore,
        functionOutput: leaderboardScoreResult
      }
    }

    // SECTION 7: Leaderboard Database
    const { data: leaderboardEntry } = await supabaseAdmin
      .from('leaderboard')
      .select('*')
      .eq('user_id', userId)
      .eq('cohort_id', cohortId)
      .single()

    runtimeData.sections.leaderboardTable = leaderboardEntry || null

    // Check for leaderboard mismatch
    if (leaderboardEntry && leaderboardScoreResult.totalScore !== leaderboardEntry.total_score) {
      addWarning('Leaderboard calculation differs from database', {
        calculated: leaderboardScoreResult.totalScore,
        database: leaderboardEntry.total_score
      })
    }

    // SECTION 8: Analytics API Comparison (called AFTER calculations)
    const analyticsApiCall = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/analytics/student/progress`, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      }
    })

    let analyticsApiData = null
    if (analyticsApiCall.ok) {
      analyticsApiData = await analyticsApiCall.json()
    }

    // Check for API mismatch
    if (analyticsApiData?.analytics?.totalScore !== undefined && 
        analyticsApiData.analytics.totalScore !== leaderboardScoreResult.totalScore) {
      addWarning('Analytics API totalScore differs from calculation', {
        calculation: leaderboardScoreResult.totalScore,
        api: analyticsApiData.analytics.totalScore
      })
    }

    runtimeData.sections.analyticsApi = {
      status: analyticsApiCall.status,
      ok: analyticsApiCall.ok,
      data: analyticsApiData
    }

    // SECTION 9: Leaderboard API Comparison (called AFTER calculations)
    const leaderboardApiCall = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/leaderboard`, {
      headers: {
        'Content-Type': 'application/json'
      }
    })

    let leaderboardApiData = null
    if (leaderboardApiCall.ok) {
      leaderboardApiData = await leaderboardApiCall.json()
    }

    // Check for API mismatch
    if (leaderboardApiData?.leaderboard) {
      const apiEntry = leaderboardApiData.leaderboard.find((e: any) => e.user_id === userId)
      if (apiEntry && apiEntry.total_score !== leaderboardScoreResult.totalScore) {
        addWarning('Leaderboard API total_score differs from calculation', {
          calculation: leaderboardScoreResult.totalScore,
          api: apiEntry.total_score
        })
      }
    }

    runtimeData.sections.leaderboardApi = {
      status: leaderboardApiCall.status,
      ok: leaderboardApiCall.ok,
      data: leaderboardApiData
    }

    // SECTION 10: Pipeline Verification (continue all pipelines even if failures)
    const pipelineVerification: any = {
      stages: [],
      failures: []
    }

    // Assignment pipeline
    pipelineVerification.stages.push({
      pipeline: 'Assignment',
      stage: 'Database Average',
      value: averageScore
    })
    pipelineVerification.stages.push({
      pipeline: 'Assignment',
      stage: 'calculateAssignmentProgress',
      value: assignmentProgressResult.averageScore
    })
    if (averageScore !== assignmentProgressResult.averageScore && averageScore !== 0) {
      pipelineVerification.failures.push({
        pipeline: 'Assignment',
        fromStage: 'Database Average',
        toStage: 'calculateAssignmentProgress',
        previousValue: averageScore,
        newValue: assignmentProgressResult.averageScore
      })
    }

    // Video pipeline
    pipelineVerification.stages.push({
      pipeline: 'Video',
      stage: 'Database Completion Rate',
      value: completionRate
    })
    pipelineVerification.stages.push({
      pipeline: 'Video',
      stage: 'calculateVideoProgress',
      value: videoProgressResult.percentage
    })
    if (completionRate !== videoProgressResult.percentage && completionRate !== 0) {
      pipelineVerification.failures.push({
        pipeline: 'Video',
        fromStage: 'Database Completion Rate',
        toStage: 'calculateVideoProgress',
        previousValue: completionRate,
        newValue: videoProgressResult.percentage
      })
    }

    // Quiz pipeline
    pipelineVerification.stages.push({
      pipeline: 'Quiz',
      stage: 'Database Average',
      value: quizAverage
    })
    pipelineVerification.stages.push({
      pipeline: 'Quiz',
      stage: 'calculateQuizProgress',
      value: quizProgressResult.averageScore
    })
    if (quizAverage !== quizProgressResult.averageScore && quizAverage !== 0) {
      pipelineVerification.failures.push({
        pipeline: 'Quiz',
        fromStage: 'Database Average',
        toStage: 'calculateQuizProgress',
        previousValue: quizAverage,
        newValue: quizProgressResult.averageScore
      })
    }

    // Overall pipeline
    pipelineVerification.stages.push({
      pipeline: 'Overall',
      stage: 'Weighted Calculation',
      value: calculatedOverall
    })
    pipelineVerification.stages.push({
      pipeline: 'Overall',
      stage: 'calculateOverallProgress',
      value: overallProgressResult.percentage
    })
    if (Math.round(calculatedOverall) !== overallProgressResult.percentage && calculatedOverall !== 0) {
      pipelineVerification.failures.push({
        pipeline: 'Overall',
        fromStage: 'Weighted Calculation',
        toStage: 'calculateOverallProgress',
        previousValue: calculatedOverall,
        newValue: overallProgressResult.percentage
      })
    }

    // Leaderboard pipeline
    pipelineVerification.stages.push({
      pipeline: 'Leaderboard',
      stage: 'calculateLeaderboardScore',
      value: leaderboardScoreResult.totalScore
    })
    if (leaderboardEntry) {
      pipelineVerification.stages.push({
        pipeline: 'Leaderboard',
        stage: 'Database',
        value: leaderboardEntry.total_score
      })
      if (leaderboardScoreResult.totalScore !== leaderboardEntry.total_score) {
        pipelineVerification.failures.push({
          pipeline: 'Leaderboard',
          fromStage: 'calculateLeaderboardScore',
          toStage: 'Database',
          previousValue: leaderboardScoreResult.totalScore,
          newValue: leaderboardEntry.total_score
        })
      }
    }

    // Analytics API pipeline
    if (analyticsApiData?.analytics?.totalScore !== undefined) {
      pipelineVerification.stages.push({
        pipeline: 'Analytics API',
        stage: 'API Response',
        value: analyticsApiData.analytics.totalScore
      })
      if (leaderboardScoreResult.totalScore !== analyticsApiData.analytics.totalScore) {
        pipelineVerification.failures.push({
          pipeline: 'Analytics API',
          fromStage: 'calculateLeaderboardScore',
          toStage: 'API Response',
          previousValue: leaderboardScoreResult.totalScore,
          newValue: analyticsApiData.analytics.totalScore
        })
      }
    }

    runtimeData.sections.pipelineVerification = pipelineVerification

    // SECTION 11: Warnings (already populated throughout)
    runtimeData.sections.warnings = runtimeData.warnings

    return NextResponse.json(runtimeData)
  } catch (error: any) {
    console.error('[GET /api/admin/debug/runtime] Error:', error)
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
    }
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 })
  }
}
