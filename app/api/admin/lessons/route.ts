import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { 
  getLessonsForCohort, 
  updateLessonAvailability, 
  updateLessonReleaseDay,
  getAllCohorts,
  createLesson,
  deleteLesson
} from '@/lib/lesson-service'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/lessons?cohortId={id}
 * Get all lessons for a specific cohort
 */
export async function GET(request: Request) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const cohortId = searchParams.get('cohortId')

    if (!cohortId) {
      return NextResponse.json({ error: 'Cohort ID is required' }, { status: 400 })
    }

    const lessons = await getLessonsForCohort(cohortId)
    return NextResponse.json({ success: true, lessons })
  } catch (error: any) {
    console.error('[GET /api/admin/lessons] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/lessons
 * Create a new lesson for a cohort
 */
export async function POST(request: Request) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { cohortId, lessonData } = body

    if (!cohortId || !lessonData) {
      return NextResponse.json({ error: 'Cohort ID and lesson data are required' }, { status: 400 })
    }

    // Validate required fields
    if (!lessonData.id || !lessonData.title || !lessonData.available_at) {
      return NextResponse.json({ error: 'Lesson ID, title, and available_at are required' }, { status: 400 })
    }

    const lesson = await createLesson(cohortId, lessonData)

    if (!lesson) {
      return NextResponse.json({ error: 'Failed to create lesson' }, { status: 500 })
    }

    return NextResponse.json({ success: true, lesson })
  } catch (error: any) {
    console.error('[POST /api/admin/lessons] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/lessons
 * Update lesson availability or release day
 */
export async function PATCH(request: Request) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { lessonId, cohortId, available_at, release_day } = body

    if (!lessonId || !cohortId) {
      return NextResponse.json({ error: 'Lesson ID and Cohort ID are required' }, { status: 400 })
    }

    let lesson

    if (available_at) {
      // Validate timestamp format
      const date = new Date(available_at)
      if (isNaN(date.getTime())) {
        return NextResponse.json({ error: 'Invalid timestamp format' }, { status: 400 })
      }

      lesson = await updateLessonAvailability(lessonId, cohortId, available_at)
    }

    if (release_day) {
      // Validate release day
      const validDays = ['monday', 'wednesday', 'friday']
      if (!validDays.includes(release_day)) {
        return NextResponse.json({ error: 'Invalid release day. Must be monday, wednesday, or friday' }, { status: 400 })
      }

      lesson = await updateLessonReleaseDay(lessonId, cohortId, release_day)
    }

    if (!lesson) {
      return NextResponse.json({ error: 'Failed to update lesson' }, { status: 500 })
    }

    return NextResponse.json({ success: true, lesson })
  } catch (error: any) {
    console.error('[PATCH /api/admin/lessons] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/lessons?lessonId={id}&cohortId={id}
 * Delete a lesson
 */
export async function DELETE(request: Request) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const lessonId = searchParams.get('lessonId')
    const cohortId = searchParams.get('cohortId')

    if (!lessonId || !cohortId) {
      return NextResponse.json({ error: 'Lesson ID and Cohort ID are required' }, { status: 400 })
    }

    const success = await deleteLesson(lessonId, cohortId)

    if (!success) {
      return NextResponse.json({ error: 'Failed to delete lesson' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[DELETE /api/admin/lessons] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
