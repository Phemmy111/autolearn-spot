import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import {
  getStudentLoginActivity,
  cacheLoginActivity,
} from '@/lib/analytics'

export const dynamic = 'force-dynamic'

/**
 * GET /api/analytics/student/activity
 * Returns login/activity timeline for a student
 */
export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '30', 10)

    const activity = await cacheLoginActivity(
      () => getStudentLoginActivity(userId, limit),
      userId
    )

    return NextResponse.json({ activity })
  } catch (error) {
    console.error('[GET /api/analytics/student/activity] Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
