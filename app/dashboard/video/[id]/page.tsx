import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, Clock, BookOpen, FileText, ClipboardCheck } from 'lucide-react'
import { auth, currentUser } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getLessonById } from '@/lib/lesson-service'
import VideoPageClient from '@/components/video-page-client'

interface VideoPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function VideoPage({ params }: VideoPageProps) {
  const { userId } = await auth()

  if (!userId) {
    redirect('/dashboard')
  }

  const resolvedParams = await params

  console.info('[video-page] loading', {
    lessonId: resolvedParams.id,
    userId: userId.slice(0, 8) + '...',
  });

  // Fetch lesson from database (supports both UUID and legacy string IDs)
  const lesson = await getLessonById(resolvedParams.id)

  if (!lesson) {
    console.error('[video-page] lesson-not-found', {
      lessonId: resolvedParams.id,
      userId: userId.slice(0, 8) + '...',
    });
    notFound()
  }

  console.info('[video-page] lesson-found', {
    lessonId: lesson.uuid_id || lesson.id,
    title: lesson.title,
    productId: lesson.product_id,
    cohortId: lesson.cohort_id,
  });

  // Check if user has access to this lesson
  let hasAccess = false
  let backUrl = '/dashboard'
  let backLabel = 'Back to Dashboard'

  const userEmail = (await currentUser())?.primaryEmailAddress?.emailAddress || ''

  if (lesson.product_id) {
    // 1. Check product enrollments by clerk_user_id
    const { data: userEnrollments } = await supabaseAdmin
      .from('enrollments')
      .select('id, status, activated_at, learning_product_id')
      .eq('clerk_user_id', userId)
      .eq('learning_product_id', lesson.product_id)
      .order('created_at', { ascending: false })

    let activeEnrollment = userEnrollments?.find(e => e.status === 'active' || e.status === 'not_started')

    // Fallback: check by email if not found or not active
    if (!activeEnrollment && userEmail) {
      const { data: emailEnrollments } = await supabaseAdmin
        .from('enrollments')
        .select('id, status, activated_at, learning_product_id')
        .eq('email', userEmail)
        .eq('learning_product_id', lesson.product_id)
        .order('created_at', { ascending: false })

      activeEnrollment = emailEnrollments?.find(e => e.status === 'active' || e.status === 'not_started')
    }

    if (activeEnrollment) {
      if (!activeEnrollment.activated_at) {
        redirect(`/dashboard/course/${lesson.product_id}`);
      }
      hasAccess = true
      backUrl = `/dashboard/course/${lesson.product_id}`
      backLabel = 'Back to Course'
    }
  }

  if (!hasAccess) {
    console.warn('[video-page] access-denied', {
      lessonId: lesson.uuid_id || lesson.id,
      userId: userId.slice(0, 8) + '...',
      productId: lesson.product_id,
    })
    redirect('/dashboard')
  }

  console.info('[video-page] access-granted', {
    lessonId: lesson.uuid_id || lesson.id,
    userId: userId.slice(0, 8) + '...',
  })

  // Fetch saved progress directly from lesson_progress
  let resumeFromSeconds = 0
  try {
    const lessonKey = lesson.uuid_id || lesson.id
    const { data: progRows } = await supabaseAdmin
      .from('lesson_progress')
      .select('last_position_seconds, completed')
      .eq('user_id', userId)
      .or(`lesson_uuid_id.eq.${lessonKey},lesson_id.eq.${lessonKey}`)
      .order('updated_at', { ascending: false })
      .limit(1)

    const row = progRows?.[0]
    if (row && !row.completed && row.last_position_seconds > 5) {
      resumeFromSeconds = row.last_position_seconds
    }
  } catch (err) {
    console.error('Failed to fetch progress:', err)
  }

  // Parse resources from JSON
  let resources: { label: string; url: string }[] = []
  try {
    if (lesson.resources) {
      if (typeof lesson.resources === 'string') {
        resources = JSON.parse(lesson.resources)
      } else if (Array.isArray(lesson.resources)) {
        resources = lesson.resources
      }
    }
  } catch (error) {
    console.error('[VideoPage] Error parsing resources:', error)
  }

  // Fetch quizzes attached to this lesson
  const lessonIdForQuery = lesson.uuid_id || lesson.id
  const { data: lessonQuizzes } = await supabaseAdmin
    .from('quizzes')
    .select('id, title, description, time_limit, passing_score, lesson_id')
    .eq('lesson_id', lessonIdForQuery)
    .eq('is_active', true)

  // Fetch assignments attached to this lesson
  const { data: lessonAssignments } = await supabaseAdmin
    .from('assignments')
    .select('id, title, description, due_date, lesson_id')
    .eq('lesson_id', lessonIdForQuery)

  // Find next lesson
  let nextLessonId: string | null = null
  if (lesson.product_id) {
    const { data: nextLessons } = await supabaseAdmin
      .from('lessons')
      .select('id, uuid_id')
      .eq('product_id', lesson.product_id)
      .gt('order_index', lesson.order_index)
      .order('order_index', { ascending: true })
      .limit(1)
    if (nextLessons && nextLessons.length > 0) {
      nextLessonId = nextLessons[0].uuid_id || nextLessons[0].id
    }
  } else if (lesson.cohort_id) {
    const { data: nextLessons } = await supabaseAdmin
      .from('lessons')
      .select('id, uuid_id')
      .eq('cohort_id', lesson.cohort_id)
      .gt('order_index', lesson.order_index)
      .order('order_index', { ascending: true })
      .limit(1)
    if (nextLessons && nextLessons.length > 0) {
      nextLessonId = nextLessons[0].uuid_id || nextLessons[0].id
    }
  }

  return (
    <VideoPageClient 
      lesson={lesson}
      nextLessonId={nextLessonId}
      resumeFromSeconds={resumeFromSeconds}
      resources={resources}
      quizzes={lessonQuizzes || []}
      assignments={lessonAssignments || []}
      backUrl={backUrl}
      backLabel={backLabel}
    />
  )
}
