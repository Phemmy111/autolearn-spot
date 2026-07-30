import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import {
  getCohortAnalytics,
  cacheCohortAnalytics,
} from '@/lib/analytics'

export const dynamic = 'force-dynamic'

/**
 * GET /api/analytics/admin/cohort
 * Returns cohort-wide analytics for administrators
 */
export async function GET(request: Request) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const cohortId = searchParams.get('cohortId') || undefined

    const analytics = await cacheCohortAnalytics(
      () => getCohortAnalytics(cohortId),
      cohortId || 'default'
    )

    return NextResponse.json({ analytics })
  } catch (error) {
    if (error instanceof Error && error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
    }
    console.error('[GET /api/analytics/admin/cohort] Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
