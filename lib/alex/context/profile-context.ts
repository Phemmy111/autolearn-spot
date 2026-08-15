/**
 * ALEX Profile Context Loader
 * 
 * Safely retrieves user profile information from Clerk authentication.
 * Does not trust client-supplied user IDs - only uses authenticated Clerk data.
 */

import { UserProfileContext, ContextError } from './context-types';

export async function getUserProfileContext(
  authenticatedUserId: string,
  userEmail?: string,
  userName?: string
): Promise<{ context: UserProfileContext | null; error: ContextError | null }> {
  try {
    // Build sanitized profile context from provided authentication data
    // We use the data already extracted from auth() in the chat route
    // to avoid making additional Clerk API calls
    const profileContext: UserProfileContext = {
      userId: authenticatedUserId,
      fullName: userName || undefined,
      email: userEmail || undefined,
    };

    return { context: profileContext, error: null };
  } catch (error) {
    return {
      context: null,
      error: {
        contextType: 'profile',
        error: error instanceof Error ? error.message : 'Unknown error fetching profile',
        isCritical: false
      }
    };
  }
}