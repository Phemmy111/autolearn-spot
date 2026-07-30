import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import {
  getStudentProgressAnalytics,
  cacheStudentProgress,
} from '@/lib/analytics'

export const dynamic = 'force-dynamic'

/**
 * GET /api/analytics/student/progress
 * Returns comprehensive student progress overview
 */
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const analytics = await cacheStudentProgress(
      () => getStudentProgressAnalytics(userId),
      userId,
      'default' // Will use current cohort
    )

    return NextResponse.json({ analytics })
  } catch (error) {
    console.error('[GET /api/analytics/student/progress] Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
