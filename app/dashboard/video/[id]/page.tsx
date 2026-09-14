import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download } from 'lucide-react'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { AutolearnBot } from '@/components/autolearn-bot'
import VideoPlayer from '@/components/video-player'
import { getUserProgress, getUserCohortId } from '@/lib/progress-service'
import { getLessonById } from '@/lib/lesson-service'
import { getUserEnrollments } from '@/lib/enrollment-service'

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
  // For product-based lessons, check enrollment
  // For cohort-based lessons, check cohort enrollment
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
      // If no direct product enrollment, check if product has a cohort and user is enrolled in that cohort
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

  // Fetch saved progress so the player can resume from the last position
  let resumeFromSeconds = 0
  try {
    const { email } = await auth()
    const cohortId = lesson.cohort_id || await getUserCohortId(userId, email)
    const progressRows = await getUserProgress(userId, cohortId)
    
    // Use uuid_id for progress lookup if available, otherwise use legacy id
    const lessonIdForProgress = lesson.uuid_id || lesson.id
    const row = progressRows.find((p) => p.lesson_id === lessonIdForProgress)
    
    // Only resume if not yet completed and position is meaningful (> 5s)
    if (row && !row.completed && row.last_position_seconds > 5) {
      resumeFromSeconds = row.last_position_seconds
    }
  } catch {
    // Non-fatal — player will start from the beginning
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

  return (
    <main className="min-h-screen bg-[var(--card)] brightness-95] text-[#e2e2e8]">
      <nav className="sticky top-0 z-50 flex h-16 items-center border-b border-[#3b494b] bg-[var(--card)] brightness-95]/95 px-4 backdrop-blur sm:px-6">
        <Link
          href={backUrl}
          className="flex items-center gap-2 font-mono text-xs font-semibold uppercase text-brand-text/60 transition hover:text-[#10b981]"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
      </nav>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <span className="mb-2 inline-block font-mono text-[10px] uppercase tracking-wider text-[#10b981]">
            {lesson.duration_label || 'Video Lesson'}
          </span>
          <h1 className="font-heading text-2xl font-bold uppercase text-brand-text sm:text-3xl">
            {lesson.title}
          </h1>
          <p className="mt-3 max-w-3xl font-mono text-sm leading-relaxed text-brand-text/60">
            {lesson.description || 'No description provided.'}
          </p>
        </div>

        {/* Video Player Container */}
        <div className="relative aspect-video w-full overflow-hidden border border-[#3b494b] bg-black shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          <VideoPlayer
            lessonId={lesson.uuid_id || lesson.id}
            youtubeVideoId={lesson.youtube_video_id || undefined}
            vimeoVideoId={lesson.vimeo_video_id || undefined}
            vdoCipherVideoId={lesson.vdo_cipher_video_id || undefined}
            resumeFromSeconds={resumeFromSeconds}
          />
        </div>

        {/* Resources Section */}
        {resources && resources.length > 0 && (
          <div className="mt-12 border border-brand-border bg-[var(--card)] brightness-95] p-6 sm:p-8">
            <h2 className="mb-6 font-mono text-lg font-semibold uppercase tracking-wider text-[#10b981]">
              Session Resources
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {resources.map((resource, i) => (
                <a
                  key={i}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 border border-[#3b494b] bg-[var(--card)] brightness-95] p-4 transition-colors hover:border-[#10b981] hover:bg-[var(--card)] brightness-95]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[var(--card)] brightness-95]/10 text-[#10b981]">
                    <Download className="h-5 w-5" />
                  </div>
                  <span className="font-mono text-sm font-semibold text-[#e2e2e8]">
                    {resource.label}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
      <AutolearnBot context="dashboard" />
    </main>
  )
}
