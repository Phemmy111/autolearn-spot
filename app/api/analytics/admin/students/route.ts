import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import {
  getStudentList,
  cacheStudentList,
} from '@/lib/analytics'

export const dynamic = 'force-dynamic'

/**
 * GET /api/analytics/admin/students
 * Returns student list with progress metrics for admin view
 */
export async function GET(request: Request) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const cohortId = searchParams.get('cohortId') || undefined
    const sortBy = (searchParams.get('sortBy') as 'progress' | 'score' | 'name' | 'activity') || 'progress'
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'

    const students = await cacheStudentList(
      () => getStudentList(cohortId, sortBy, sortOrder),
      cohortId || 'default',
      sortBy,
      sortOrder
    )

    return NextResponse.json({ students })
  } catch (error) {
    if (error instanceof Error && error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
    }
    console.error('[GET /api/analytics/admin/students] Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
