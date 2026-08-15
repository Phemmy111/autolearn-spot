import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { AlexCostTracker } from '@/lib/alex/cost-tracker'

// GET /api/alex/usage - Get user usage statistics
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const scope = searchParams.get('scope') || 'user' // 'user' or 'admin'

    if (scope === 'admin') {
      // Admin analytics - would need admin verification here
      const analytics = await AlexCostTracker.getAdminAnalytics()
      return NextResponse.json({ analytics })
    } else {
      // User usage
      const usage = await AlexCostTracker.getUserUsage(userId)
      return NextResponse.json({ usage })
    }
  } catch (error) {
    console.error('Error in GET /api/alex/usage:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}