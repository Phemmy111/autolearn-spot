import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { migrateLocalStorageProgress, getCurrentCohortId } from '@/lib/progress-service'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { completedLessonIds } = body

    if (!completedLessonIds || !Array.isArray(completedLessonIds)) {
      return NextResponse.json({ error: 'Missing or invalid parameter: completedLessonIds' }, { status: 400 })
    }

    const cohortId = await getCurrentCohortId()
    const result = await migrateLocalStorageProgress(userId, cohortId, completedLessonIds)

    return NextResponse.json(result)
  } catch (error) {
    console.error('[POST /api/progress/migrate] Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
