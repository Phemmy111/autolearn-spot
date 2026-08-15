/**
 * ALEX Learning Context Loader
 * 
 * Safely retrieves user learning progress using existing progress service.
 * Reuses the existing getCompletionSummary and getUserProgress functions.
 */

import { supabaseAdmin } from '@/lib/supabase';
import { LearningContext, ContextError } from './context-types';

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

    // Get recent lesson progress with lesson details
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