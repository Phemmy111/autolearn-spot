import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, Clock, BookOpen, FileText, ClipboardCheck } from 'lucide-react'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getUserProgress, getUserCohortId } from '@/lib/progress-service'
import { getLessonById } from '@/lib/lesson-service'
import { getUserEnrollments } from '@/lib/enrollment-service'
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
  // Try product enrollment first, then cohort enrollment as fallback
  let hasAccess = false
  let backUrl = '/dashboard'
  let backLabel = 'Back to Dashboard'

  if (lesson.product_id) {
    // Product-based lesson - check enrollment
    const { data: enrollment } = await supabaseAdmin
      .from('enrollments')
      .select('id, status, activated_at, learning_product:learning_products(*)')
      .eq('clerk_user_id', userId)
      .eq('learning_product_id', lesson.product_id)
      .single()

    console.info('[video-page] product-enrollment-check', {
      productId: lesson.product_id,
      enrollmentFound: !!enrollment,
      enrollmentStatus: enrollment?.status,
      enrollmentActivated: !!enrollment?.activated_at,
    });

    if (enrollment && enrollment.status === 'active' && enrollment.activated_at) {
      hasAccess = true
      backUrl = `/dashboard/course/${lesson.product_id}`
      backLabel = 'Back to Course'
    } else {
      // Fallback: check if product has a cohort and user is enrolled in that cohort
      const { data: product } = await supabaseAdmin
        .from('learning_products')
        .select('cohort_id')
        .eq('id', lesson.product_id)
        .single();

      if (product?.cohort_id) {
        const { data: cohortEnrollment } = await supabaseAdmin
          .from('enrollments')
          .select('id, status, activated_at')
          .eq('clerk_user_id', userId)
          .eq('cohort_id', product.cohort_id)
          .single();

        console.info('[video-page] product-cohort-enrollment-check', {
          productId: lesson.product_id,
          cohortId: product.cohort_id,
          cohortEnrollmentFound: !!cohortEnrollment,
          cohortEnrollmentStatus: cohortEnrollment?.status,
        });

        if (cohortEnrollment && cohortEnrollment.status === 'active') {
          hasAccess = true
          backUrl = `/dashboard/course/${lesson.product_id}`
          backLabel = 'Back to Course'
        }
      }
    }
  } else if (lesson.cohort_id) {
    // Cohort-based lesson - check cohort enrollment
    const { email } = await auth()
    const enrollments = await getUserEnrollments(userId, email || '')
    const cohortEnrollment = enrollments.find(e => e.cohort_id === lesson.cohort_id)

    console.info('[video-page] cohort-enrollment-check', {
      cohortId: lesson.cohort_id,
      cohortEnrollmentFound: !!cohortEnrollment,
      cohortEnrollmentStatus: cohortEnrollment?.status,
    });

    if (cohortEnrollment && cohortEnrollment.status === 'active') {
      hasAccess = true
    }
  }

  if (!hasAccess) {
    console.warn('[video-page] access-denied', {
      lessonId: lesson.uuid_id || lesson.id,
      userId: userId.slice(0, 8) + '...',
      productId: lesson.product_id,
      cohortId: lesson.cohort_id,
    });
    redirect('/dashboard')
  }

  console.info('[video-page] access-granted', {
    lessonId: lesson.uuid_id || lesson.id,
    userId: userId.slice(0, 8) + '...',
  });

  // Fetch saved progress
  let resumeFromSeconds = 0
  try {
    const { email } = await auth()
    const cohortId = await getUserCohortId(userId, email || '')
    const progressRows = await getUserProgress(userId, cohortId)
    const row = progressRows.find((p) => p.lesson_id === (lesson.uuid_id || lesson.id))
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
