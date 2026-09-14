import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, Clock, BookOpen, FileText, ClipboardCheck } from 'lucide-react'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
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

  // TEMPORARILY DISABLED: Fetch saved progress so the player can resume from the last position
  // This is causing video loading issues
  let resumeFromSeconds = 0

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
  console.info('[video-page] lesson-query-info', {
    lessonIdForQuery,
    hasUuid: !!lesson.uuid_id,
    hasLegacyId: !!lesson.id,
  })

  const { data: lessonQuizzes, error: quizError } = await supabaseAdmin
    .from('quizzes')
    .select('id, title, description, time_limit, passing_score, lesson_id')
    .eq('lesson_id', lessonIdForQuery)
    .eq('is_active', true)

  console.info('[video-page] lesson-quizzes', {
    lessonId: lessonIdForQuery,
    quizCount: lessonQuizzes?.length || 0,
    quizError: quizError?.message,
    quizzes: lessonQuizzes,
  })

  // Fetch assignments attached to this lesson
  const { data: lessonAssignments, error: assignmentError } = await supabaseAdmin
    .from('assignments')
    .select('id, title, description, due_date, lesson_id')
    .eq('lesson_id', lessonIdForQuery)

  console.info('[video-page] lesson-assignments', {
    lessonId: lessonIdForQuery,
    assignmentCount: lessonAssignments?.length || 0,
    assignmentError: assignmentError?.message,
    assignments: lessonAssignments,
  })

  // Also check if there are any assignments in the database at all
  const { data: allAssignments, error: allAssignmentsError } = await supabaseAdmin
    .from('assignments')
    .select('id, title, lesson_id')
    .limit(5)

  console.info('[video-page] all-assignments-sample', {
    totalCount: allAssignments?.length || 0,
    error: allAssignmentsError?.message,
    sample: allAssignments,
  })

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* Header */}
      <nav className="sticky top-0 z-50 flex h-16 items-center border-b border-neutral-200 bg-white/95 px-4 backdrop-blur sm:px-6">
        <Link
          href={backUrl}
          className="flex items-center gap-2 text-sm font-medium text-neutral-600 transition hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Lesson Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 text-xs font-medium text-neutral-600">
              <Clock className="h-3.5 w-3.5" />
              {lesson.duration_label || 'Video Lesson'}
            </span>
            {lesson.week_number && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 text-xs font-medium text-neutral-600">
                <BookOpen className="h-3.5 w-3.5" />
                Week {lesson.week_number}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">
            {lesson.title}
          </h1>
          <p className="mt-3 text-base text-neutral-600 leading-relaxed max-w-3xl">
            {lesson.description || 'No description provided.'}
          </p>
        </div>

        {/* Video Player Container */}
        <div className="relative w-full overflow-hidden rounded-2xl bg-neutral-900 shadow-lg" style={{ aspectRatio: '16/9', minHeight: '200px' }}>
          {lesson.youtube_video_id ? (
            <iframe
              id={`youtube-player-${lesson.uuid_id || lesson.id}`}
              src={`https://www.youtube.com/embed/${lesson.youtube_video_id}?modestbranding=1&rel=0&playsinline=1&showinfo=0&iv_load_policy=3&controls=0&disablekb=1&fs=0&enablejsapi=1&origin=${encodeURIComponent(process.env.NEXT_PUBLIC_APP_URL || 'https://autolearn-spot.vercel.app')}`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : lesson.vimeo_video_id ? (
            <iframe
              src={`https://player.vimeo.com/video/${lesson.vimeo_video_id}?autoplay=1`}
              className="w-full h-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="flex items-center justify-center h-full text-neutral-400">
              No video available
            </div>
          )}
        </div>

        {/* Progress Tracking Script */}
        {lesson.youtube_video_id && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                var tag = document.createElement('script');
                tag.src = "https://www.youtube.com/iframe_api";
                var firstScriptTag = document.getElementsByTagName('script')[0];
                firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

                var player;
                var lessonId = '${lesson.uuid_id || lesson.id}';
                var interval;
                var isPlaying = false;

                function onYouTubeIframeAPIReady() {
                  player = new YT.Player('youtube-player-' + lessonId, {
                    events: {
                      'onStateChange': function(event) {
                        if (event.data == YT.PlayerState.PLAYING) {
                          isPlaying = true;
                          startProgressTracking();
                        } else {
                          isPlaying = false;
                          stopProgressTracking();
                        }
                      },
                      'onReady': function() {
                        player.playVideo();
                      }
                    }
                  });
                }

                function togglePlayPause() {
                  if (!player) return;
                  if (isPlaying) {
                    player.pauseVideo();
                  } else {
                    player.playVideo();
                  }
                }

                function toggleFullscreen() {
                  var iframe = document.getElementById('youtube-player-' + lessonId);
                  if (document.fullscreenElement) {
                    document.exitFullscreen();
                  } else {
                    iframe.requestFullscreen();
                  }
                }

                function rewindVideo() {
                  if (!player) return;
                  var currentTime = player.getCurrentTime();
                  player.seekTo(Math.max(0, currentTime - 10), true);
                }

                function forwardVideo() {
                  if (!player) return;
                  var currentTime = player.getCurrentTime();
                  var duration = player.getDuration();
                  player.seekTo(Math.min(duration, currentTime + 10), true);
                }

                function seekVideo(percentage) {
                  if (!player) return;
                  var duration = player.getDuration();
                  player.seekTo((percentage / 100) * duration, true);
                }

                function updateProgressBar() {
                  if (!player) return;
                  var currentTime = player.getCurrentTime();
                  var duration = player.getDuration();
                  var percentage = (currentTime / duration) * 100;
                  var progressBar = document.getElementById('progress-bar');
                  if (progressBar) {
                    progressBar.style.width = percentage + '%';
                  }
                }

                function startProgressTracking() {
                  if (interval) clearInterval(interval);
                  interval = setInterval(function() {
                    try {
                      var currentTime = player.getCurrentTime();
                      var duration = player.getDuration();
                      var watchPct = (currentTime / duration) * 100;
                      
                      updateProgressBar();
                      
                      if (watchPct >= 80) {
                        saveProgress(watchPct, currentTime, true);
                      } else {
                        saveProgress(watchPct, currentTime, false);
                      }
                    } catch(e) {
                      console.error('Progress tracking error:', e);
                    }
                  }, 1000);
                }

                function stopProgressTracking() {
                  if (interval) {
                    clearInterval(interval);
                    interval = null;
                  }
                  try {
                    var currentTime = player.getCurrentTime();
                    var duration = player.getDuration();
                    var watchPct = (currentTime / duration) * 100;
                    saveProgress(watchPct, currentTime, false);
                  } catch(e) {}
                }

                function saveProgress(watchPct, currentTime, completed) {
                  fetch('/api/progress', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      lessonId: lessonId,
                      watchPct: watchPct,
                      lastPositionSeconds: currentTime,
                      completed: completed
                    })
                  }).catch(console.error);
                }

                window.addEventListener('beforeunload', function() {
                  stopProgressTracking();
                });

                window.toggleVideoPlayPause = togglePlayPause;
                window.toggleVideoFullscreen = toggleFullscreen;
                window.rewindVideo = rewindVideo;
                window.forwardVideo = forwardVideo;
                window.seekVideo = seekVideo;
              `
            }}
          />
        )}

        {/* Custom Video Controls */}
        {lesson.youtube_video_id && (
          <div className="mt-4 space-y-3">
            <div 
              className="w-full bg-neutral-200 rounded-full h-2 cursor-pointer" 
              onClick={(e) => {
                const progressBar = e.currentTarget;
                const rect = progressBar.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const percentage = (clickX / rect.width) * 100;
                
                if (typeof window !== 'undefined' && window.seekVideo) {
                  window.seekVideo(percentage);
                }
              }}
            >
              <div id="progress-bar" className="bg-neutral-900 h-2 rounded-full transition-all" style={{ width: '0%' }}></div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.toggleVideoPlayPause) {
                      window.toggleVideoPlayPause();
                    }
                  }}
                  className="flex items-center justify-center w-12 h-12 rounded-full bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
                  title="Play/Pause"
                >
                  <Play className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.rewindVideo) {
                      window.rewindVideo();
                    }
                  }}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-neutral-800 text-white hover:bg-neutral-700 transition-colors"
                  title="Rewind 10s"
                >
                  -10s
                </button>
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.forwardVideo) {
                      window.forwardVideo();
                    }
                  }}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-neutral-800 text-white hover:bg-neutral-700 transition-colors"
                  title="Forward 10s"
                >
                  +10s
                </button>
              </div>
              <button
                onClick={() => {
                  if (typeof window !== 'undefined' && window.toggleVideoFullscreen) {
                    window.toggleVideoFullscreen();
                  }
                }}
                className="flex items-center justify-center w-12 h-12 rounded-full bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
                title="Fullscreen"
              >
                <Maximize className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Resources Section */}
        {resources && resources.length > 0 && (
          <div className="mt-12 border border-neutral-200 bg-white rounded-2xl p-6 sm:p-8">
            <h2 className="mb-6 text-lg font-semibold text-neutral-900">
              Session Resources
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {resources.map((resource, i) => (
                <a
                  key={i}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-xl border border-neutral-200 bg-neutral-50 hover:border-neutral-300 hover:bg-neutral-100 transition-colors"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-neutral-600">
                    <Download className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-neutral-900">
                    {resource.label}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Quizzes Section */}
        {lessonQuizzes && lessonQuizzes.length > 0 && (
          <div className="mt-12 border border-neutral-200 bg-white rounded-2xl p-6 sm:p-8">
            <h2 className="mb-6 text-lg font-semibold text-neutral-900 flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Quiz
            </h2>
            <div className="space-y-4">
              {lessonQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-neutral-200 bg-neutral-50"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-neutral-900">{quiz.title}</h3>
                    {quiz.description && (
                      <p className="mt-1 text-sm text-neutral-600">{quiz.description}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-neutral-500">
                      {quiz.time_limit && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {quiz.time_limit} minutes
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        Pass mark: {quiz.passing_score}%
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/quiz/${quiz.id}`}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-colors"
                  >
                    Take Quiz
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assignments Section */}
        {lessonAssignments && lessonAssignments.length > 0 && (
          <div className="mt-12 border border-neutral-200 bg-white rounded-2xl p-6 sm:p-8">
            <h2 className="mb-6 text-lg font-semibold text-neutral-900 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Assignment
            </h2>
            <div className="space-y-4">
              {lessonAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-neutral-200 bg-neutral-50"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-neutral-900">{assignment.title}</h3>
                    {assignment.description && (
                      <p className="mt-1 text-sm text-neutral-600">{assignment.description}</p>
                    )}
                    {assignment.due_date && (
                      <p className="mt-2 text-xs text-neutral-500">
                        Due: {new Date(assignment.due_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/dashboard/assignments?assignment=${assignment.id}`}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-colors"
                  >
                    View Assignment
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
