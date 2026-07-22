import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUserProgress, upsertLessonProgress, getCompletionSummary, getCurrentCohortId } from '@/lib/progress-service'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cohortId = await getCurrentCohortId()
    const progress = await getUserProgress(userId, cohortId)
    const summary = await getCompletionSummary(userId, cohortId)

    return NextResponse.json({ progress, summary })
  } catch (error) {
    console.error('[GET /api/progress] Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { lessonId, watchPct, lastPositionSeconds, completed } = body

    if (!lessonId) {
      return NextResponse.json({ error: 'Missing required parameter: lessonId' }, { status: 400 })
    }

    const cohortId = await getCurrentCohortId()
    
    const updatedProgress = await upsertLessonProgress(userId, cohortId, lessonId, {
      watchPct,
      lastPositionSeconds,
      completed
    })

    if (!updatedProgress) {
      return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 })
    }

    return NextResponse.json({ success: true, progress: updatedProgress })
  } catch (error) {
    console.error('[POST /api/progress] Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
