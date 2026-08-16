/**
 * ALEX Profile Context Loader
 * 
 * Safely retrieves user profile information from both Clerk authentication
 * and the AutoLearn Spot enrollments table.
 * Does not trust client-supplied user IDs - only uses authenticated Clerk data.
 */

import { UserProfileContext, ContextError } from './context-types';
import { supabaseAdmin } from '@/lib/supabase';

export async function getUserProfileContext(
  authenticatedUserId: string,
  userEmail?: string,
  userName?: string
): Promise<{ context: UserProfileContext | null; error: ContextError | null }> {
  try {
    // First, try to get profile data from enrollments table (authoritative source)
    const { data: enrollment, error: enrollmentError } = await supabaseAdmin
      .from('enrollments')
      .select('first_name, last_name, full_name, email')
      .eq('clerk_user_id', authenticatedUserId)
      .single();

    let firstName: string | undefined;
    let lastName: string | undefined;
    let fullName: string | undefined;
    let email: string | undefined;

    if (enrollment && !enrollmentError) {
      // Use enrollment data as primary source
      firstName = enrollment.first_name || undefined;
      lastName = enrollment.last_name || undefined;
      fullName = enrollment.full_name || (enrollment.first_name && enrollment.last_name 
        ? `${enrollment.first_name} ${enrollment.last_name}` 
        : undefined);
      email = enrollment.email || userEmail;
    } else {
      // Fallback to Clerk data if no enrollment found
      firstName = userName?.split(' ')[0] || userName;
      lastName = userName?.includes(' ') ? userName.split(' ').slice(1).join(' ') : undefined;
      fullName = userName;
      email = userEmail;
    }

    // Build sanitized profile context
    const profileContext: UserProfileContext = {
      userId: authenticatedUserId,
      firstName,
      lastName,
      fullName,
      email,
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