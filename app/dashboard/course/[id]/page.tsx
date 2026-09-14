import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getLessonsForProduct } from '@/lib/lesson-service';
import Link from 'next/link';
import { Lock, Play, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import StartCourseButton from './StartCourseButton';

export default async function CoursePage({ params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const productId = params.id;

  console.info('[course-page] loading', {
    productId,
    userId: userId.slice(0, 8) + '...',
  });

  // 1. Verify ownership and get enrollment details (including status)
  const { data: enrollment } = await supabaseAdmin
    .from('enrollments')
    .select('id, activated_at, status, learning_product:learning_products(*)')
    .eq('clerk_user_id', userId)
    .eq('learning_product_id', productId)
    .single();

  if (!enrollment) {
    console.warn('[course-page] enrollment-not-found', {
      productId,
      userId: userId.slice(0, 8) + '...',
    });
    redirect('/dashboard'); // Not enrolled
  }

  console.info('[course-page] enrollment-found', {
    enrollmentId: enrollment.id,
    activatedAt: enrollment.activated_at,
    status: enrollment.status,
  });

  const isStarted = !!enrollment.activated_at;
  const course: any = Array.isArray(enrollment.learning_product) ? enrollment.learning_product[0] : enrollment.learning_product;

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

  // 3. Fetch all lessons ordered
  const lessons = await getLessonsForProduct(productId);
  lessons.sort((a, b) => a.order_index - b.order_index);

  console.info('[course-page] lessons-loaded', {
    lessonCount: lessons.length,
    firstLessonId: lessons[0]?.uuid_id || lessons[0]?.id,
  });

  // 4. Fetch progress for these lessons
  // Use uuid_id for progress lookups since that's the new primary key
  const lessonIds = lessons.map(l => l.uuid_id || l.id);
  let progressMap = new Map();
  if (lessonIds.length > 0) {
    const { data: progressRows } = await supabaseAdmin
      .from('lesson_progress')
      .select('lesson_uuid_id, watch_pct, completed')
      .eq('user_id', userId)
      .in('lesson_uuid_id', lessonIds);

    progressMap = new Map(progressRows?.map((p: any) => [p.lesson_uuid_id, p]) || []);

    console.info('[course-page] progress-loaded', {
      progressCount: progressMap.size,
      completedLessons: Array.from(progressMap.values()).filter(p => p.completed).length,
    });
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
      const prevLessonId = prevLesson.uuid_id || prevLesson.id;
      const prevProgress = progressMap.get(prevLessonId);
      if (prevProgress && (prevProgress.completed || (prevProgress.watch_pct && prevProgress.watch_pct >= 80))) {
        unlocked = true;
      }
    }

    const lessonId = lesson.uuid_id || lesson.id;
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
        <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-brand-text mb-1 tracking-tight">
          {course?.title}
        </h1>
        <p className="text-lg text-brand-text/60 max-w-2xl">
          {course?.description}
        </p>

        {/* Start Course Button OR Countdown Bar */}
        {!isStarted ? (
          <div className="mt-2 p-5 rounded-2xl border border-amber-300/60 bg-amber-50/60 max-w-xl">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-brand-text mb-1">Ready to begin?</p>
                <p className="text-xs text-brand-text/60">
                  Once you start this course, your <strong>{course?.access_duration_days}-day</strong> access
                  will begin counting down. You can watch the lessons at your own pace within that period.
                </p>
              </div>
            </div>
            <StartCourseButton enrollmentId={enrollment.id} />
          </div>
        ) : (
          <div className="mt-2 p-4 rounded-2xl border border-brand-border/60 bg-[var(--card)] max-w-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm font-medium text-brand-text">
                <Clock className="w-4 h-4 text-[#10b981]" />
                Course Access
              </div>
              <span className={`text-sm font-bold ${daysLeft !== null && daysLeft < 5 ? 'text-red-500' : 'text-[#10b981]'}`}>
                {daysLeft !== null ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left` : 'N/A'}
              </span>
            </div>
            {/* Countdown bar */}
            <div className="w-full bg-brand-border/30 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-1000 ${daysLeft !== null && daysLeft < 5 ? 'bg-red-500' : 'bg-[#10b981]'}`}
                style={{ width: `${countdownPercent}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-brand-text/50">
              <span>{completedCount}/{lessons.length} lessons completed</span>
              <span>{course?.access_duration_days} days total</span>
            </div>
          </div>
        )}
      </div>

      {/* Curriculum */}
      <div className="space-y-6">
        <h2 className="text-2xl font-heading font-bold text-brand-text tracking-tight">
          Curriculum
        </h2>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {enrichedLessons.map((lesson, idx) => {
            return (
              <div
                key={lesson.id}
                className={`group relative flex flex-col overflow-hidden rounded-[20px] bg-[var(--card)] border border-brand-border/60 ${
                  lesson.unlocked
                    ? 'hover:border-[#10b981]/40 hover:shadow-[0_12px_40px_-10px_rgba(0,0,0,0.08)]'
                    : 'opacity-75 grayscale-[0.5]'
                } transition-all duration-300`}
              >
                <Link
                  href={lesson.unlocked ? `/dashboard/video/${lesson.uuid_id || lesson.id}` : '#'}
                  className={`block aspect-video w-full relative overflow-hidden bg-brand-bg border-b border-neutral-100 ${!lesson.unlocked && 'cursor-not-allowed'}`}
                >
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    {lesson.unlocked ? (
                      <div className="w-12 h-12 rounded-full bg-[var(--card)]/90 backdrop-blur-md shadow-lg flex items-center justify-center text-[#10b981] transition-all">
                        <Play className="h-5 w-5 ml-1 fill-current" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[var(--card)] brightness-95/80 backdrop-blur-sm border border-brand-border/50 flex items-center justify-center text-neutral-400">
                        <Lock className="h-5 w-5" />
                      </div>
                    )}
                  </div>

                  {lesson.completed && (
                    <div className="absolute top-3 left-3 bg-[#10b981] text-white px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 z-10 shadow-lg">
                      <CheckCircle className="w-3 h-3" /> Completed
                    </div>
                  )}
                  {lesson.watch_pct > 0 && !lesson.completed && (
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-border/50 z-10">
                      <div className="h-full bg-[#10b981]" style={{ width: `${lesson.watch_pct}%` }} />
                    </div>
                  )}
                </Link>

                <div className="flex flex-1 flex-col p-5">
                  <h3 className={`font-heading font-bold text-lg leading-tight mb-2 ${lesson.unlocked ? 'text-brand-text group-hover:text-[#10b981]' : 'text-brand-text/70'}`}>
                    {idx + 1}. {lesson.title}
                  </h3>
                  <p className="text-sm text-brand-text/60 line-clamp-2 mb-5 flex-1">
                    {lesson.description || 'No description provided.'}
                  </p>
                  
                  {lesson.unlocked ? (
                    <Link
                      href={`/dashboard/video/${lesson.uuid_id || lesson.id}`}
                      className="inline-flex items-center justify-center bg-[var(--card)] border border-brand-border px-4 py-2 text-sm font-semibold text-neutral-700 rounded-xl hover:bg-brand-bg transition-all shadow-sm"
                    >
                      {lesson.watch_pct > 0 ? 'Continue' : 'Watch'}
                    </Link>
                  ) : !isStarted ? (
                    <div className="text-xs text-brand-text/50 bg-brand-bg p-2 rounded-lg border border-brand-border/50 text-center">
                      Start the course to unlock lessons
                    </div>
                  ) : (
                    <div className="text-xs text-brand-text/50 bg-brand-bg p-2 rounded-lg border border-brand-border/50 text-center">
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
