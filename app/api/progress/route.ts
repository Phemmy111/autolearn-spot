import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUserProgress, upsertLessonProgress, getCompletionSummary, getUserCohortId } from '@/lib/progress-service'
import { triggerLeaderboardUpdate } from '@/lib/leaderboard-scoring'
import { triggerBadgeCheck } from '@/lib/badge-system'

export async function GET() {
  try {
    const { userId, email } = await auth()
    console.log('[GET /api/progress] Auth values:', { userId, email });
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cohortId = await getUserCohortId(userId, email || '')
    console.log('[GET /api/progress] Resolved cohort ID:', cohortId);
    
    const progress = await getUserProgress(userId, cohortId)
    const summary = await getCompletionSummary(userId, cohortId)

    console.log('[GET /api/progress] Progress/summary results:', { 
      progressCount: progress.length, 
      summary 
    });

    return NextResponse.json({ progress, summary })
  } catch (error) {
    console.error('[GET /api/progress] Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { userId, email } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { lessonId, watchPct, lastPositionSeconds, completed } = body

    if (!lessonId) {
      return NextResponse.json({ error: 'Missing required parameter: lessonId' }, { status: 400 })
    }

    const cohortId = await getUserCohortId(userId, email || '')
    
    const updatedProgress = await upsertLessonProgress(userId, cohortId, lessonId, {
      watchPct,
      lastPositionSeconds,
      completed
    })

    if (!updatedProgress) {
      return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 })
    }

    // Trigger leaderboard update when a lesson is completed
    if (completed) {
      try {
        await triggerLeaderboardUpdate(userId, 'video')
      } catch (leaderboardError) {
        console.error('Failed to trigger leaderboard update:', leaderboardError)
        // Don't fail the progress update if leaderboard update fails
      }

      // Trigger badge check when a lesson is completed
      try {
        await triggerBadgeCheck(userId, cohortId)
      } catch (badgeError) {
        console.error('Failed to trigger badge check:', badgeError)
        // Don't fail the progress update if badge check fails
      }
    }

    return NextResponse.json({ success: true, progress: updatedProgress })
  } catch (error) {
    console.error('[POST /api/progress] Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
