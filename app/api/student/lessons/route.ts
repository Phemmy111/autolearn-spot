import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUserCohortId } from '@/lib/progress-service'
import { getLessonsForCohort } from '@/lib/lesson-service'

export async function GET() {
  try {
    const { userId, email } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cohortId = await getUserCohortId(userId, email)
    const lessons = await getLessonsForCohort(cohortId)

    // Filter to only include lessons that are currently available
    const availableLessons = lessons.filter(lesson => {
      return new Date() >= new Date(lesson.available_at)
    })

    return NextResponse.json({ 
      success: true, 
      lessons: availableLessons,
      cohortId
    })
  } catch (error) {
    console.error('[GET /api/student/lessons] Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
