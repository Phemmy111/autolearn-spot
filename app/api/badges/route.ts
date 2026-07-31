import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUserBadges } from '@/lib/badge-system'

export const dynamic = 'force-dynamic'

/**
 * GET /api/badges
 * Returns all badges for the authenticated user
 */
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const badges = await getUserBadges(userId)

    return NextResponse.json({ badges })
  } catch (error) {
    console.error('[GET /api/badges] Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}