import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import {
  getStudentQuizPerformance,
  cacheQuizPerformance,
} from '@/lib/analytics'

export const dynamic = 'force-dynamic'

/**
 * GET /api/analytics/student/quizzes
 * Returns detailed quiz performance for a student
 */
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const performance = await cacheQuizPerformance(
      () => getStudentQuizPerformance(userId),
      userId,
      'default'
    )

    return NextResponse.json({ performance })
  } catch (error) {
    console.error('[GET /api/analytics/student/quizzes] Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
