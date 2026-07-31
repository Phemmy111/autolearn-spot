import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUserBadges } from '@/lib/badge-system'

export const dynamic = 'force-dynamic'

/**
 * GET /api/badges
 * Returns all badges for the authenticated user or a specific user by userId query param
 */
export async function GET(request: Request) {
  try {
    const { userId: authUserId } = await auth()
    if (!authUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const targetUserId = searchParams.get('userId') || authUserId

    const badges = await getUserBadges(targetUserId)

    return NextResponse.json({ badges })
  } catch (error) {
    console.error('[GET /api/badges] Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}