import { recordLoginActivity, updateSessionDuration } from './student-analytics'
import { invalidateStudentProgressCache, invalidateCohortAnalyticsCache } from './cache-manager'

/**
 * Integration utilities for connecting analytics with existing workflows
 */

/**
 * Track user login - call this after successful authentication
 */
export async function trackUserLogin(
  userId: string,
  cohortId: string | null,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await recordLoginActivity(userId, cohortId, ipAddress, userAgent)
}

/**
 * Track user logout - update session duration
 */
export async function trackUserLogout(
  userId: string,
  sessionDurationSeconds: number
): Promise<void> {
  await updateSessionDuration(userId, sessionDurationSeconds)
}

/**
 * Invalidate analytics caches after lesson progress update
 */
export async function invalidateAfterLessonProgress(
  userId: string,
  cohortId: string
): Promise<void> {
  await invalidateStudentProgressCache(userId, cohortId)
  await invalidateCohortAnalyticsCache(cohortId)
}

/**
 * Invalidate analytics caches after assignment submission
 */
export async function invalidateAfterAssignmentSubmission(
  userId: string,
  cohortId: string
): Promise<void> {
  await invalidateStudentProgressCache(userId, cohortId)
  await invalidateCohortAnalyticsCache(cohortId)
}

/**
 * Invalidate analytics caches after quiz completion
 */
export async function invalidateAfterQuizCompletion(
  userId: string,
  cohortId: string
): Promise<void> {
  await invalidateStudentProgressCache(userId, cohortId)
  await invalidateCohortAnalyticsCache(cohortId)
}

/**
 * Invalidate analytics caches after certificate issuance
 */
export async function invalidateAfterCertificateIssuance(
  userId: string,
  cohortId: string
): Promise<void> {
  await invalidateStudentProgressCache(userId, cohortId)
  await invalidateCohortAnalyticsCache(cohortId)
}
