import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getLessonsForProduct } from '@/lib/lesson-service';
import Link from 'next/link';
import { Lock, Play, CheckCircle, Clock, AlertTriangle, Video, MessageSquare, ExternalLink } from 'lucide-react';
import StartCourseButton from './StartCourseButton';
import LiveClassSection from './LiveClassSection';
import AuthorMessagingSection from './AuthorMessagingSection';

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const resolvedParams = await params;
  const productId = resolvedParams.id;

  console.info('[course-page] loading', {
    productId,
    userId: userId.slice(0, 8) + '...',
  });

  // 1. Verify ownership - check product enrollment first, then cohort enrollment as fallback
  let enrollment: any = null;
  let isCohortEnrollment = false;

  // First, try product enrollment
  const { data: productEnrollment } = await supabaseAdmin
    .from('enrollments')
    .select('id, activated_at, status, learning_product:learning_products(*)')
    .eq('clerk_user_id', userId)
    .eq('learning_product_id', productId)
    .single();

  if (productEnrollment) {
    enrollment = productEnrollment;
    console.info('[course-page] product-enrollment-found', {
      enrollmentId: enrollment.id,
      activatedAt: enrollment.activated_at,
      status: enrollment.status,
    });
  } else {
    // Fallback: check if user has a cohort enrollment for this product
    const { data: product } = await supabaseAdmin
      .from('learning_products')
      .select('id, title, description, access_duration_days, cohort_id')
      .eq('id', productId)
      .single();

    if (product && product.cohort_id) {
      const { data: cohortEnrollment } = await supabaseAdmin
        .from('enrollments')
        .select('id, activated_at, status, cohort_id')
        .eq('clerk_user_id', userId)
        .eq('cohort_id', product.cohort_id)
        .single();

      if (cohortEnrollment) {
        isCohortEnrollment = true;
        enrollment = {
          ...cohortEnrollment,
          learning_product: product,
        };
        console.info('[course-page] cohort-enrollment-found', {
          enrollmentId: enrollment.id,
          cohortId: product.cohort_id,
          activatedAt: enrollment.activated_at,
          status: enrollment.status,
        });
      }
    }
  }

  if (!enrollment) {
    console.warn('[course-page] enrollment-not-found', {
      productId,
      userId: userId.slice(0, 8) + '...',
    });
    redirect('/dashboard'); // Not enrolled
  }

  const isStarted = !!enrollment.activated_at || isCohortEnrollment; // Cohort enrollments are auto-started
  const course: any = Array.isArray(enrollment.learning_product) ? enrollment.learning_product[0] : enrollment.learning_product;

  console.info('[course-page] course-start-status', {
    isStarted,
    isCohortEnrollment,
    activatedAt: enrollment.activated_at,
  });

  // 2. Compute countdown if started
  let daysLeft: number | null = null;
  let countdownPercent = 0;
  if (isStarted && enrollment.activated_at && course?.access_duration_days) {
    const activatedTime = new Date(enrollment.activated_at).getTime();
    const now = Date.now();
    const msPerDay = 24 * 60 * 60 * 1000;
    const totalMs = course.access_duration_days * msPerDay;
    daysLeft = Math.max(0, Math.ceil((activatedTime + totalMs - now) / msPerDay));
    countdownPercent = Math.max(0, Math.min(100, 100 - (daysLeft / course.access_duration_days) * 100));
  }

  // 3. Fetch all lessons ordered (support both product and cohort lessons)
  let lessons: any[] = [];
  if (isCohortEnrollment) {
    // For cohort enrollments, fetch cohort lessons
    const { data: product } = await supabaseAdmin
      .from('learning_products')
      .select('cohort_id')
      .eq('id', productId)
      .single();

    if (product?.cohort_id) {
      const { data: cohortLessons } = await supabaseAdmin
        .from('lessons')
        .select('*')
        .eq('cohort_id', product.cohort_id)
        .order('order_index', { ascending: true });
      lessons = cohortLessons || [];
      console.info('[course-page] cohort-lessons-loaded', {
        cohortId: product.cohort_id,
        lessonCount: lessons.length,
      });
    }
  } else {
    // For product enrollments, fetch product lessons
    lessons = await getLessonsForProduct(productId);
  }

  lessons.sort((a, b) => a.order_index - b.order_index);

  console.info('[course-page] lessons-loaded', {
    lessonCount: lessons.length,
    firstLessonId: lessons[0]?.uuid_id || lessons[0]?.id,
    isCohortEnrollment,
  });

  // 4. Fetch progress for these lessons
  // Cohort lessons use lesson_id, product lessons use lesson_uuid_id
  let progressMap = new Map();
  if (lessons.length > 0) {
    if (isCohortEnrollment) {
      // Cohort lessons use legacy lesson_id
      const lessonIds = lessons.map(l => l.id);
      const { data: progressRows } = await supabaseAdmin
        .from('lesson_progress')
        .select('lesson_id, watch_pct, completed')
        .eq('user_id', userId)
        .in('lesson_id', lessonIds);

      progressMap = new Map(progressRows?.map((p: any) => [p.lesson_id, p]) || []);

      console.info('[course-page] progress-loaded-cohort', {
        progressCount: progressMap.size,
        completedLessons: Array.from(progressMap.values()).filter(p => p.completed).length,
      });
    } else {
      // Product lessons use uuid_id - query without cohort_id filter
      const lessonIds = lessons.map(l => l.uuid_id || l.id);
      const { data: progressRows } = await supabaseAdmin
        .from('lesson_progress')
        .select('lesson_uuid_id, watch_pct, completed')
        .eq('user_id', userId)
        .in('lesson_uuid_id', lessonIds);

      progressMap = new Map(progressRows?.map((p: any) => [p.lesson_uuid_id, p]) || []);

      console.info('[course-page] progress-loaded-product', {
        progressCount: progressMap.size,
        completedLessons: Array.from(progressMap.values()).filter(p => p.completed).length,
        lessonIds,
        progressData: progressRows
      });
    }
  }

  // 5. Determine unlock status (80% rule)
  // - If course not started, ALL lessons are locked
  // - First lesson is always unlocked (once started)
  // - Subsequent lessons unlock if previous lesson has watch_pct >= 80 or completed = true
  const enrichedLessons = lessons.map((lesson, index) => {
    let unlocked = false;

    if (!isStarted) {
      // Course not started — all locked
      unlocked = false;
    } else if (index === 0) {
      unlocked = true;
    } else {
      const prevLesson = lessons[index - 1];
      const prevLessonId = isCohortEnrollment ? prevLesson.id : (prevLesson.uuid_id || prevLesson.id);
      const prevProgress = progressMap.get(prevLessonId);
      if (prevProgress && (prevProgress.completed || (prevProgress.watch_pct && prevProgress.watch_pct >= 80))) {
        unlocked = true;
      }
    }

    const lessonId = isCohortEnrollment ? lesson.id : (lesson.uuid_id || lesson.id);
    const prog = progressMap.get(lessonId);
    return {
      ...lesson,
      unlocked,
      watch_pct: prog?.watch_pct || 0,
      completed: prog?.completed || false,
    };
  });

  // Count completed lessons
  const completedCount = enrichedLessons.filter(l => l.completed).length;

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link href="/dashboard" className="text-[#10b981] text-sm hover:underline font-mono">
          &larr; Back to Dashboard
        </Link>
        <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-neutral-900 mb-1 tracking-tight">
          {course?.title}
        </h1>
        <p className="text-lg text-neutral-600 max-w-2xl">
          {(() => {
            let desc = course?.description;
            try {
              if (typeof desc === 'string' && desc.startsWith('{')) {
                const obj = JSON.parse(desc);
                return obj.short_description || obj.description || desc;
              }
            } catch(e) {}
            return desc;
          })()}
        </p>

        {/* Start Course Button OR Countdown Bar */}
        {!isStarted && !isCohortEnrollment ? (
          <div className="mt-2 p-5 rounded-2xl border border-amber-200 bg-amber-50 max-w-xl">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-neutral-900 mb-1">Ready to begin?</p>
                <p className="text-xs text-neutral-600">
                  Once you start this course, your <strong>{course?.access_duration_days}-day</strong> access
                  will begin counting down. You can watch the lessons at your own pace within that period.
                </p>
              </div>
            </div>
            <StartCourseButton enrollmentId={enrollment.id} />
          </div>
        ) : (
          <div className="mt-2 p-4 rounded-2xl border border-neutral-200 bg-white max-w-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                <Clock className="w-4 h-4 text-neutral-600" />
                Course Access
              </div>
              <span className={`text-sm font-bold ${daysLeft !== null && daysLeft < 5 ? 'text-red-600' : 'text-neutral-900'}`}>
                {daysLeft !== null ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left` : 'N/A'}
              </span>
            </div>
            {/* Countdown bar */}
            <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-1000 ${daysLeft !== null && daysLeft < 5 ? 'bg-red-500' : 'bg-neutral-900'}`}
                style={{ width: `${countdownPercent}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-neutral-500">
              <span>{completedCount}/{lessons.length} lessons completed</span>
              <span>{course?.access_duration_days} days total</span>
            </div>
          </div>
        )}
      </div>

      {/* Live Classes and Messaging */}
      <div className="grid gap-6 lg:grid-cols-2">
        <LiveClassSection productId={productId} userId={userId} />
        <AuthorMessagingSection productId={productId} userId={userId} />
      </div>

      {/* Curriculum */}
      <div className="space-y-6">
        <h2 className="text-2xl font-heading font-bold text-neutral-900 tracking-tight">
          Curriculum
        </h2>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {enrichedLessons.map((lesson, idx) => {
            return (
              <div
                key={lesson.id}
                className={`group relative flex flex-col overflow-hidden rounded-2xl bg-white border border-neutral-200 ${
                  lesson.unlocked
                    ? 'hover:border-neutral-300 hover:shadow-lg'
                    : 'opacity-60 grayscale'
                } transition-all duration-300`}
              >
                <Link
                  href={lesson.unlocked ? `/dashboard/video/${isCohortEnrollment ? lesson.id : (lesson.uuid_id || lesson.id)}` : '#'}
                  className={`block aspect-video w-full relative overflow-hidden bg-neutral-100 border-b border-neutral-200 ${!lesson.unlocked && 'cursor-not-allowed'}`}
                >
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    {lesson.unlocked ? (
                      <div className="w-14 h-14 rounded-full bg-white/95 backdrop-blur-md shadow-lg flex items-center justify-center text-neutral-900 transition-all group-hover:scale-110">
                        <Play className="h-6 w-6 ml-1 fill-current" />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-white/80 backdrop-blur-sm border border-neutral-300 flex items-center justify-center text-neutral-400">
                        <Lock className="h-6 w-6" />
                      </div>
                    )}
                  </div>

                  {lesson.completed && (
                    <div className="absolute top-3 left-3 bg-neutral-900 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 z-10 shadow-lg">
                      <CheckCircle className="w-3.5 h-3.5" /> Completed
                    </div>
                  )}
                  {lesson.watch_pct > 0 && !lesson.completed && (
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-neutral-200 z-10">
                      <div className="h-full bg-neutral-900" style={{ width: `${lesson.watch_pct}%` }} />
                    </div>
                  )}
                </Link>

                <div className="flex flex-1 flex-col p-5">
                  <h3 className={`font-heading font-semibold text-base leading-tight mb-2 ${lesson.unlocked ? 'text-neutral-900 group-hover:text-neutral-700' : 'text-neutral-500'}`}>
                    {idx + 1}. {lesson.title}
                  </h3>
                  <p className="text-sm text-neutral-500 line-clamp-2 mb-4 flex-1">
                    {lesson.description || 'No description provided.'}
                  </p>

                  {lesson.unlocked ? (
                    <Link
                      href={`/dashboard/video/${isCohortEnrollment ? lesson.id : (lesson.uuid_id || lesson.id)}`}
                      className="inline-flex items-center justify-center bg-neutral-900 text-white px-4 py-2.5 text-sm font-medium rounded-xl hover:bg-neutral-800 transition-colors"
                    >
                      {lesson.watch_pct > 0 ? 'Continue' : 'Watch'}
                    </Link>
                  ) : !isStarted ? (
                    <div className="text-xs text-neutral-500 bg-neutral-50 p-2.5 rounded-lg border border-neutral-200 text-center">
                      Start the course to unlock lessons
                    </div>
                  ) : (
                    <div className="text-xs text-neutral-500 bg-neutral-50 p-2.5 rounded-lg border border-neutral-200 text-center">
                      Watch {idx > 0 ? `80% of "${lessons[idx - 1].title}"` : 'previous lesson'} to unlock
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
