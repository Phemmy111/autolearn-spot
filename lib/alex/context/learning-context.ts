/**
 * ALEX Learning Context Loader
 * 
 * Retrieves comprehensive learning context including lesson ordering and progress.
 * Determines current lesson and next lesson based on completion state.
 */

import { supabaseAdmin } from '@/lib/supabase';
import { LearningContext, ContextError, LessonInfo } from './context-types';

export async function getLearningContext(
  authenticatedUserId: string,
  userEmail?: string
): Promise<{ context: LearningContext | null; error: ContextError | null }> {
  try {
    // Get the user's course ID (use enrollment or fall back to current course)
    const courseId = await getUserCourseId(authenticatedUserId, userEmail);

    // Get completion summary
    const { total: totalLessons, completed: completedLessons, percentage: progressPercentage } = 
      await getCompletionSummary(authenticatedUserId, courseId);

    // Get all lessons with progress information for proper ordering
    const allLessons = await getAllLessonsWithProgress(authenticatedUserId, courseId);

    // Determine current and next lesson
    const { currentLesson, nextLesson } = determineCurrentAndNextLesson(allLessons);

    // Get recent lesson progress for recent activity display
    const recentProgress = await getRecentLessonProgress(authenticatedUserId, courseId);

    // Get course name
    const { data: course } = await supabaseAdmin
      .from('learning_products')
      .select('title')
      .eq('id', courseId)
      .single();

    const context: LearningContext = {
      totalLessons,
      completedLessons,
      progressPercentage,
      recentLessonProgress: recentProgress,
      currentCourseId: courseId,
      currentCourseName: course?.title || 'Unknown Course',
      allLessons,
      currentLesson,
      nextLesson,
    };

    return { context, error: null };
  } catch (error) {
    return {
      context: null,
      error: {
        contextType: 'learning',
        error: error instanceof Error ? error.message : 'Unknown error fetching learning context',
        isCritical: false
      }
    };
  }
}

async function getUserCourseId(userId: string, email?: string): Promise<string> {
  // Try to get user's enrolled course
  let query = supabaseAdmin
    .from('enrollments')
    .select('learning_product_id, status');

  if (email) {
    query = query.or(`clerk_user_id.eq.${userId},email.eq.${email}`);
  } else {
    query = query.eq('clerk_user_id', userId);
  }

  const { data: enrollments } = await query;

  if (enrollments && enrollments.length > 0) {
    // Prefer active enrollment
    const activeEnrollment = enrollments.find(e => e.status === 'active') || enrollments[0];
    if (activeEnrollment?.learning_product_id) {
      return activeEnrollment.learning_product_id;
    }
  }

  // Fallback to active course in learning_products
  const { data: currentCourse } = await supabaseAdmin
    .from('learning_products')
    .select('id')
    .limit(1)
    .maybeSingle();

  return currentCourse?.id || 'c1e11cc7-d8f6-4c2d-8a3b-1bb204892921';
}

async function getCompletionSummary(userId: string, courseId: string) {
  const { data: lessons } = await supabaseAdmin
    .from('lessons')
    .select('id, uuid_id')
    .eq('product_id', courseId);

  const total = lessons?.length || 0;
  const lessonIds = new Set([
    ...(lessons || []).map(l => l.id),
    ...(lessons || []).map(l => l.uuid_id).filter(Boolean)
  ]);

  const { data: progressRows } = await supabaseAdmin
    .from('lesson_progress')
    .select('lesson_id, lesson_uuid_id, completed, watch_pct')
    .eq('user_id', userId);

  const completed = (progressRows || []).filter(p => {
    const isThisCourse = (p.lesson_id && lessonIds.has(p.lesson_id)) || (p.lesson_uuid_id && lessonIds.has(p.lesson_uuid_id));
    return isThisCourse && (p.completed || (p.watch_pct && p.watch_pct >= 80));
  }).length;

  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { total, completed, percentage };
}

async function getRecentLessonProgress(userId: string, courseId: string) {
  const { data: progressData } = await supabaseAdmin
    .from('lesson_progress')
    .select('lesson_id, lesson_uuid_id, completed, watch_pct, last_position_seconds, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(10);

  if (!progressData || progressData.length === 0) return [];

  const { data: lessons } = await supabaseAdmin
    .from('lessons')
    .select('id, uuid_id, title, week_number')
    .eq('product_id', courseId);

  const lessonMap = new Map();
  (lessons || []).forEach(l => {
    if (l.id) lessonMap.set(l.id, l);
    if (l.uuid_id) lessonMap.set(l.uuid_id, l);
  });

  return progressData.map(progress => {
    const lesson = lessonMap.get(progress.lesson_uuid_id) || lessonMap.get(progress.lesson_id);
    return {
      lessonId: progress.lesson_uuid_id || progress.lesson_id,
      lessonTitle: lesson?.title || 'Lesson Video',
      weekNumber: lesson?.week_number || 0,
      completed: !!progress.completed || (progress.watch_pct && progress.watch_pct >= 80),
      watchPercentage: progress.watch_pct || 0,
      lastPosition: progress.last_position_seconds || 0,
    };
  });
}

async function getAllLessonsWithProgress(userId: string, courseId: string): Promise<LessonInfo[]> {
  // Get all lessons for the course, ordered by week_number and order_index
  const { data: lessons } = await supabaseAdmin
    .from('lessons')
    .select('id, uuid_id, title, week_number, session_number, order_index, available_at')
    .eq('product_id', courseId)
    .order('week_number', { ascending: true })
    .order('order_index', { ascending: true });

  if (!lessons || lessons.length === 0) return [];

  // Get user's lesson progress
  const { data: progressData } = await supabaseAdmin
    .from('lesson_progress')
    .select('lesson_id, lesson_uuid_id, completed, watch_pct')
    .eq('user_id', userId);

  // Create a map of lesson progress
  const progressMap = new Map();
  if (progressData) {
    progressData.forEach(progress => {
      const isDone = !!progress.completed || (progress.watch_pct && progress.watch_pct >= 80);
      if (progress.lesson_uuid_id) {
        progressMap.set(progress.lesson_uuid_id, {
          completed: isDone,
          watchPercentage: progress.watch_pct || 0,
        });
      }
      if (progress.lesson_id) {
        progressMap.set(progress.lesson_id, {
          completed: isDone,
          watchPercentage: progress.watch_pct || 0,
        });
      }
    });
  }

  // Combine lesson info with progress
  const now = new Date();
  return lessons.map(lesson => {
    const progress = progressMap.get(lesson.uuid_id) || progressMap.get(lesson.id) || { completed: false, watchPercentage: 0 };
    const isAvailable = lesson.available_at ? new Date(lesson.available_at) <= now : true;

    return {
      lessonId: lesson.uuid_id || lesson.id,
      title: lesson.title,
      weekNumber: lesson.week_number || 0,
      sessionNumber: lesson.session_number || 0,
      orderIndex: lesson.order_index || 0,
      completed: progress.completed,
      watchPercentage: progress.watchPercentage,
      available: isAvailable,
    };
  });
}

function determineCurrentAndNextLesson(allLessons: LessonInfo[]): {
  currentLesson?: LessonInfo;
  nextLesson?: LessonInfo;
} {
  // Find the first incomplete lesson that is available
  let nextLesson: LessonInfo | undefined;
  let currentLesson: LessonInfo | undefined;

  for (let i = 0; i < allLessons.length; i++) {
    const lesson = allLessons[i];
    
    if (!lesson.completed && lesson.available) {
      nextLesson = lesson;
      // Current lesson is the one before nextLesson, or the first lesson if no progress
      if (i > 0) {
        currentLesson = allLessons[i - 1];
      }
      break;
    }
  }

  // If all lessons are completed, last lesson is current
  if (!nextLesson && allLessons.length > 0) {
    const lastCompletedLesson = [...allLessons].reverse().find(l => l.completed);
    if (lastCompletedLesson) {
      currentLesson = lastCompletedLesson;
    }
  }

  // If no lessons are started, first available lesson is current
  if (!currentLesson && !nextLesson && allLessons.length > 0) {
    const firstAvailable = allLessons.find(l => l.available);
    if (firstAvailable) {
      currentLesson = firstAvailable;
      if (allLessons.length > 1) {
        nextLesson = allLessons.find(l => l.lessonId !== firstAvailable.lessonId && l.available);
      }
    }
  }

  return { currentLesson, nextLesson };
}