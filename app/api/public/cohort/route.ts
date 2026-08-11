import { NextResponse } from 'next/server'
import { getActiveCohort } from '@/lib/cohort'

export const dynamic = 'force-dynamic'

/**
 * GET /api/public/cohort
 * Get the currently active cohort for public display
 */
export async function GET() {
  try {
    const cohort = await getActiveCohort()

    if (!cohort) {
      return NextResponse.json({ 
        success: false, 
        cohort: null 
      })
    }

    return NextResponse.json({ 
      success: true, 
      cohort: {
        id: cohort.id,
        name: cohort.name,
        slug: cohort.slug,
        start_date: cohort.start_date,
        end_date: cohort.end_date,
        status: cohort.status,
        is_current: cohort.is_current
      }
    })
  } catch (error: any) {
    console.error('[GET /api/public/cohort] Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
}
