import { auth, currentUser } from '@clerk/nextjs/server'
import { headers } from 'next/headers'
import { trackUserLogin } from '@/lib/analytics/integration'
import { getUserCohortId } from '@/lib/progress-service'

/**
 * Track user login activity
 * Call this after successful authentication
 */
export async function trackAuthentication() {
  try {
    const { userId } = await auth()
    const user = await currentUser()
    
    if (!userId || !user) {
      return
    }

    // Get user's IP address from headers
    const headersList = await headers()
    const forwarded = headersList.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : headersList.get('x-real-ip') || null

    // Get user agent
    const userAgent = headersList.get('user-agent') || null

    // Get user's enrolled cohort ID
    const cohortId = await getUserCohortId(userId, user.emailAddresses[0]?.emailAddress || '')

    // Track login
    await trackUserLogin(userId, cohortId, ip || undefined, userAgent || undefined)
  } catch (error) {
    console.error('[auth-tracking] Failed to track authentication:', error)
    // Don't fail authentication if tracking fails
  }
}

/**
 * Track user logout and update session duration
 */
export async function trackLogout(sessionDurationSeconds: number) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return
    }

    const { trackUserLogout } = await import('@/lib/analytics/integration')
    await trackUserLogout(userId, sessionDurationSeconds)
  } catch (error) {
    console.error('[auth-tracking] Failed to track logout:', error)
    // Don't fail logout if tracking fails
  }
}
