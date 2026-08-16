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
    // Get the user's cohort ID (use enrollment or fall back to current cohort)
    const cohortId = await getUserCohortId(authenticatedUserId, userEmail);

    // Get completion summary
    const { total: totalLessons, completed: completedLessons, percentage: progressPercentage } = 
      await getCompletionSummary(authenticatedUserId, cohortId);

    // Get all lessons with progress information for proper ordering
    const allLessons = await getAllLessonsWithProgress(authenticatedUserId, cohortId);

    // Determine current and next lesson
    const { currentLesson, nextLesson } = determineCurrentAndNextLesson(allLessons);

    // Get recent lesson progress for recent activity display
    const recentProgress = await getRecentLessonProgress(authenticatedUserId, cohortId);

    // Get cohort name
    const { data: cohort } = await supabaseAdmin
      .from('cohorts')
      .select('name')
      .eq('id', cohortId)
      .single();

    const context: LearningContext = {
      totalLessons,
      completedLessons,
      progressPercentage,
      recentLessonProgress: recentProgress,
      currentCohortId: cohortId,
      currentCohortName: cohort?.name || 'Unknown Cohort',
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

async function getUserCohortId(userId: string, email?: string): Promise<string> {
  // Try to get user's enrolled cohort
  const { data: enrollments } = await supabaseAdmin
    .from('enrollments')
    .select('cohort_id, status')
    .eq('clerk_user_id', userId);

  if (enrollments && enrollments.length > 0) {
    // Prefer active enrollment
    const activeEnrollment = enrollments.find(e => e.status === 'active') || enrollments[0];
    return activeEnrollment.cohort_id;
  }

  // Fallback to email lookup
  if (email) {
    const { data: emailEnrollments } = await supabaseAdmin
      .from('enrollments')
      .select('cohort_id')
      .eq('email', email);

    if (emailEnrollments && emailEnrollments.length > 0) {
      return emailEnrollments[0].cohort_id;
    }
  }

  // Fallback to current cohort
  const { data: currentCohort } = await supabaseAdmin
    .from('cohorts')
    .select('id')
    .eq('is_current', true)
    .single();

  return currentCohort?.id || 'a1111111-1111-1111-1111-111111111111';
}

async function getCompletionSummary(userId: string, cohortId: string) {
  const { count: totalLessons } = await supabaseAdmin
    .from('lessons')
    .select('id', { count: 'exact', head: true })
    .eq('cohort_id', cohortId);

  const { count: completedLessons } = await supabaseAdmin
    .from('lesson_progress')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('cohort_id', cohortId)
    .eq('completed', true);

  const total = totalLessons || 0;
  const completed = completedLessons || 0;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { total, completed, percentage };
}

async function getRecentLessonProgress(userId: string, cohortId: string) {
  const { data: progressData } = await supabaseAdmin
    .from('lesson_progress')
    .select(`
      lesson_id,
      completed,
      watch_pct,
      last_position_seconds,
      lesson:lessons (
        id,
        title,
        week_number
      )
    `)
    .eq('user_id', userId)
    .eq('cohort_id', cohortId)
    .order('updated_at', { ascending: false })
    .limit(10);

  if (!progressData) return [];

  return progressData.map(progress => ({
    lessonId: progress.lesson_id,
    lessonTitle: (progress.lesson as any)?.title || 'Unknown Lesson',
    weekNumber: (progress.lesson as any)?.week_number || 0,
    completed: progress.completed,
    watchPercentage: progress.watch_pct,
    lastPosition: progress.last_position_seconds,
  }));
}

async function getAllLessonsWithProgress(userId: string, cohortId: string): Promise<LessonInfo[]> {
  // Get all lessons for the cohort, ordered by week_number and order_index
  const { data: lessons } = await supabaseAdmin
    .from('lessons')
    .select('id, title, week_number, session_number, order_index, available_at')
    .eq('cohort_id', cohortId)
    .order('week_number', { ascending: true })
    .order('order_index', { ascending: true });

  if (!lessons) return [];

  // Get user's lesson progress
  const { data: progressData } = await supabaseAdmin
    .from('lesson_progress')
    .select('lesson_id, completed, watch_pct')
    .eq('user_id', userId)
    .eq('cohort_id', cohortId);

  // Create a map of lesson progress
  const progressMap = new Map();
  if (progressData) {
    progressData.forEach(progress => {
      progressMap.set(progress.lesson_id, {
        completed: progress.completed,
        watchPercentage: progress.watch_pct,
      });
    });
  }

  // Combine lesson info with progress
  const now = new Date();
  return lessons.map(lesson => {
    const progress = progressMap.get(lesson.id) || { completed: false, watchPercentage: 0 };
    const isAvailable = new Date(lesson.available_at) <= now;

    return {
      lessonId: lesson.id,
      title: lesson.title,
      weekNumber: lesson.week_number,
      sessionNumber: lesson.session_number,
      orderIndex: lesson.order_index,
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