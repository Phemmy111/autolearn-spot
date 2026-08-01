import { unstable_cache, revalidateTag } from 'next/cache'

/**
 * Cache configuration
 */
const CACHE_CONFIG = {
  studentProgress: { revalidate: 300 }, // 5 minutes
  cohortAnalytics: { revalidate: 600 }, // 10 minutes
  leaderboard: { revalidate: 300 }, // 5 minutes
  studentList: { revalidate: 600 }, // 10 minutes
  assignmentPerformance: { revalidate: 300 }, // 5 minutes
  quizPerformance: { revalidate: 300 }, // 5 minutes
  loginActivity: { revalidate: 60 }, // 1 minute
} as const

/**
 * Generate cache key for student progress
 */
export function getStudentProgressCacheKey(userId: string, cohortId: string): string {
  return `student_progress:${userId}:${cohortId}`
}

/**
 * Generate cache key for cohort analytics
 */
export function getCohortAnalyticsCacheKey(cohortId: string): string {
  return `cohort_analytics:${cohortId}`
}

/**
 * Generate cache key for leaderboard
 */
export function getLeaderboardCacheKey(cohortId: string): string {
  return `leaderboard:${cohortId}`
}

/**
 * Generate cache key for student list
 */
export function getStudentListCacheKey(cohortId: string, sortBy: string, sortOrder: string): string {
  return `student_list:${cohortId}:${sortBy}:${sortOrder}`
}

/**
 * Generate cache key for assignment performance
 */
export function getAssignmentPerformanceCacheKey(userId: string, cohortId: string): string {
  return `assignment_performance:${userId}:${cohortId}`
}

/**
 * Generate cache key for quiz performance
 */
export function getQuizPerformanceCacheKey(userId: string, cohortId: string): string {
  return `quiz_performance:${userId}:${cohortId}`
}

/**
 * Generate cache key for login activity
 */
export function getLoginActivityCacheKey(userId: string): string {
  return `login_activity:${userId}`
}

/**
 * Invalidate cache for student progress
 */
export async function invalidateStudentProgressCache(
  userId: string,
  cohortId: string
): Promise<void> {
  console.log('[cache-manager] Invalidating student progress cache:', { userId, cohortId })
  revalidateTag('student-progress', 'max')
  revalidateTag(userId, 'max')
  revalidateTag(cohortId, 'max')
}

/**
 * Invalidate cache for cohort analytics
 */
export async function invalidateCohortAnalyticsCache(cohortId: string): Promise<void> {
  console.log('[cache-manager] Invalidating cohort analytics cache:', { cohortId })
  revalidateTag('cohort-analytics', 'max')
  revalidateTag(cohortId, 'max')
}

/**
 * Invalidate cache for leaderboard
 */
export async function invalidateLeaderboardCache(cohortId: string): Promise<void> {
  console.log('[cache-manager] Invalidating leaderboard cache:', { cohortId })
  revalidateTag('leaderboard', 'max')
  revalidateTag(cohortId, 'max')
}

/**
 * Invalidate cache for student list
 */
export async function invalidateStudentListCache(
  cohortId: string,
  sortBy: string,
  sortOrder: string
): Promise<void> {
  console.log('[cache-manager] Invalidating student list cache:', { cohortId, sortBy, sortOrder })
  revalidateTag('student-list', 'max')
  revalidateTag(cohortId, 'max')
}

/**
 * Cache wrapper for student progress
 */
export function cacheStudentProgress<T>(
  fn: () => Promise<T>,
  userId: string,
  cohortId: string
): Promise<T> {
  return unstable_cache(fn, [getStudentProgressCacheKey(userId, cohortId)], {
    revalidate: CACHE_CONFIG.studentProgress.revalidate,
    tags: ['student-progress', userId, cohortId],
  })()
}

/**
 * Cache wrapper for cohort analytics
 */
export function cacheCohortAnalytics<T>(
  fn: () => Promise<T>,
  cohortId: string
): Promise<T> {
  return unstable_cache(fn, [getCohortAnalyticsCacheKey(cohortId)], {
    revalidate: CACHE_CONFIG.cohortAnalytics.revalidate,
    tags: ['cohort-analytics', cohortId],
  })()
}

/**
 * Cache wrapper for leaderboard
 */
export function cacheLeaderboard<T>(
  fn: () => Promise<T>,
  cohortId: string
): Promise<T> {
  return unstable_cache(fn, [getLeaderboardCacheKey(cohortId)], {
    revalidate: CACHE_CONFIG.leaderboard.revalidate,
    tags: ['leaderboard', cohortId],
  })()
}

/**
 * Cache wrapper for student list
 */
export function cacheStudentList<T>(
  fn: () => Promise<T>,
  cohortId: string,
  sortBy: string,
  sortOrder: string
): Promise<T> {
  return unstable_cache(fn, [getStudentListCacheKey(cohortId, sortBy, sortOrder)], {
    revalidate: CACHE_CONFIG.studentList.revalidate,
    tags: ['student-list', cohortId],
  })()
}

/**
 * Cache wrapper for assignment performance
 */
export function cacheAssignmentPerformance<T>(
  fn: () => Promise<T>,
  userId: string,
  cohortId: string
): Promise<T> {
  return unstable_cache(fn, [getAssignmentPerformanceCacheKey(userId, cohortId)], {
    revalidate: CACHE_CONFIG.assignmentPerformance.revalidate,
    tags: ['assignment-performance', userId, cohortId],
  })()
}

/**
 * Cache wrapper for quiz performance
 */
export function cacheQuizPerformance<T>(
  fn: () => Promise<T>,
  userId: string,
  cohortId: string
): Promise<T> {
  return unstable_cache(fn, [getQuizPerformanceCacheKey(userId, cohortId)], {
    revalidate: CACHE_CONFIG.quizPerformance.revalidate,
    tags: ['quiz-performance', userId, cohortId],
  })()
}

/**
 * Cache wrapper for login activity
 */
export function cacheLoginActivity<T>(
  fn: () => Promise<T>,
  userId: string
): Promise<T> {
  return unstable_cache(fn, [getLoginActivityCacheKey(userId)], {
    revalidate: CACHE_CONFIG.loginActivity.revalidate,
    tags: ['login-activity', userId],
  })()
}

/**
 * Invalidate all caches for a user
 */
export async function invalidateAllUserCaches(userId: string, cohortId: string): Promise<void> {
  await Promise.all([
    invalidateStudentProgressCache(userId, cohortId),
    invalidateAssignmentPerformanceCache(userId, cohortId),
    invalidateQuizPerformanceCache(userId, cohortId),
    invalidateLoginActivityCache(userId),
  ])
}

/**
 * Invalidate all caches for a cohort
 */
export async function invalidateAllCohortCaches(cohortId: string): Promise<void> {
  await Promise.all([
    invalidateCohortAnalyticsCache(cohortId),
    invalidateLeaderboardCache(cohortId),
    invalidateStudentListCache(cohortId, 'progress', 'desc'),
    invalidateStudentListCache(cohortId, 'score', 'desc'),
    invalidateStudentListCache(cohortId, 'name', 'asc'),
    invalidateStudentListCache(cohortId, 'activity', 'desc'),
  ])
}
