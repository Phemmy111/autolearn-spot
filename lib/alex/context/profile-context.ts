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
    let fullName: string | undefined = userName;
    let firstName: string | undefined;
    let lastName: string | undefined;
    let email: string | undefined = userEmail;

    // 1. Check authors table first (if user is an author or admin instructor)
    try {
      const { data: author } = await supabaseAdmin
        .from('authors')
        .select('display_name, name, email')
        .or(`clerk_user_id.eq.${authenticatedUserId},user_id.eq.${authenticatedUserId}`)
        .limit(1)
        .maybeSingle();

      if (author?.display_name || author?.name) {
        fullName = author.display_name || author.name;
        if (author.email && !email) email = author.email;
      }
    } catch (e) {
      // ignore
    }

    // 2. Check profiles table
    if (!fullName) {
      try {
        const { data: prof } = await supabaseAdmin
          .from('profiles')
          .select('full_name')
          .or(`clerk_user_id.eq.${authenticatedUserId},id.eq.${authenticatedUserId}`)
          .limit(1)
          .maybeSingle();
        if (prof?.full_name) {
          fullName = prof.full_name;
        }
      } catch (e) {
        // ignore
      }
    }

    // 3. Check enrollments table (prefer active and latest enrolled)
    try {
      let enrQuery = supabaseAdmin
        .from('enrollments')
        .select('first_name, last_name, full_name, email, status, activated_at');

      if (email) {
        enrQuery = enrQuery.or(`clerk_user_id.eq.${authenticatedUserId},email.eq.${email}`);
      } else {
        enrQuery = enrQuery.eq('clerk_user_id', authenticatedUserId);
      }

      const { data: enrollments } = await enrQuery.order('activated_at', { ascending: false }).limit(5);

      if (enrollments && enrollments.length > 0) {
        const activeEnr = enrollments.find(e => e.status === 'active') || enrollments[0];
        if (activeEnr.email && !email) email = activeEnr.email;

        // If we don't have a reliable full name yet, use enrollment
        if (!fullName) {
          fullName = activeEnr.full_name || (activeEnr.first_name && activeEnr.last_name ? `${activeEnr.first_name} ${activeEnr.last_name}` : activeEnr.first_name);
        }
        firstName = activeEnr.first_name || undefined;
        lastName = activeEnr.last_name || undefined;
      }
    } catch (e) {
      // ignore
    }

    // If still no split first/last, derive from fullName
    if (fullName) {
      const parts = fullName.trim().split(/\s+/);
      if (!firstName && parts.length > 0) firstName = parts[0];
      if (!lastName && parts.length > 1) lastName = parts.slice(1).join(' ');
    }

    const profileContext: UserProfileContext = {
      userId: authenticatedUserId,
      firstName,
      lastName,
      fullName: fullName || 'Student',
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