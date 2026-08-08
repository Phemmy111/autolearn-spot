import { supabaseAdmin } from '@/lib/supabase';
import { cache } from 'react';
import { currentUser } from '@clerk/nextjs/server';

export interface Enrollment {
  id: string;
  cohort_id: string;
  email: string;
  clerk_user_id: string | null;
  payment_ref: string | null;
  amount_paid: number | null;
  status: string;
  starts_at: string | null;
  expires_at: string | null;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  cohort?: {
    id: string;
    name: string;
    slug: string;
    is_current: boolean;
  };
}

interface EnrollmentUpdateData {
  clerk_user_id: string;
}

/**
 * Automatically link an email-only enrollment to a Clerk User ID
 * Also captures the user's name from Clerk
 */
export async function linkEmailToClerkUser(
  email: string,
  clerkUserId: string
): Promise<void> {
  try {
    // Simplified: Just link the clerk_user_id without fetching name data
    // Name data will be updated when user actively uses the application
    
    const updateData: EnrollmentUpdateData = {
      clerk_user_id: clerkUserId,
    };

    const { data, error } = await supabaseAdmin
      .from('enrollments')
      .update(updateData)
      .eq('email', email)
      .is('clerk_user_id', null)
      .select();

    if (error) {
      console.error('Failed to link enrollment to Clerk user:', error);
    } else if (data && data.length > 0) {
      console.log(
        `Successfully linked ${data.length} enrollment(s) to Clerk user ${clerkUserId}`
      );
    }
  } catch (error) {
    console.error('Error in linkEmailToClerkUser:', error);
  }
}

/**
 * Fetch all enrollments for a given Clerk user (and auto-link if needed)
 */
export const getUserEnrollments = cache(
  async (
    clerkUserId: string,
    email: string
  ): Promise<Enrollment[]> => {
    console.log('[getUserEnrollments] Input values:', { clerkUserId, email });
    
    if (!clerkUserId) {
      console.log('[getUserEnrollments] Missing clerkUserId, returning empty');
      return [];
    }

    // Auto-link email enrollment to Clerk account (only if email is provided)
    if (email) {
      await linkEmailToClerkUser(email, clerkUserId);
    }

    const { data, error } = await supabaseAdmin
      .from('enrollments')
      .select(`
        *,
        cohort:cohorts (
          id,
          name,
          slug,
          is_current
        )
      `)
      .eq('clerk_user_id', clerkUserId);

    console.log('[getUserEnrollments] Query result:', { 
      recordCount: data?.length || 0, 
      error: error?.message,
      enrollments: data?.map(e => ({ id: e.id, email: e.email, clerk_user_id: e.clerk_user_id, cohort_id: e.cohort_id }))
    });

    if (error) {
      console.error('Error fetching user enrollments:', error);
      return [];
    }

    // If no enrollment found by clerk_user_id, try email fallback
    if (!data || data.length === 0) {
      if (email) {
        console.log('[getUserEnrollments] No enrollment by clerk_user_id, trying email fallback');
        const { data: emailData, error: emailError } = await supabaseAdmin
          .from('enrollments')
          .select(`
            *,
            cohort:cohorts (
              id,
              name,
              slug,
              is_current
            )
          `)
          .eq('email', email);

        console.log('[getUserEnrollments] Email fallback result:', { 
          recordCount: emailData?.length || 0, 
          error: emailError?.message,
          enrollments: emailData?.map(e => ({ id: e.id, email: e.email, clerk_user_id: e.clerk_user_id, cohort_id: e.cohort_id }))
        });

        if (emailError) {
          console.error('Error fetching enrollments by email:', emailError);
          return [];
        }

        // If found by email, link the clerk_user_id for future lookups
        if (emailData && emailData.length > 0) {
          console.log('[getUserEnrollments] Found enrollment by email, linking clerk_user_id');
          await linkEmailToClerkUser(email, clerkUserId);
          return (emailData ?? []) as Enrollment[];
        }
      }
    }

    return (data ?? []) as Enrollment[];
  }
);

/**
 * Check if the user has at least one active enrollment
 */
export async function hasActiveEnrollment(
  clerkUserId: string,
  email: string
): Promise<boolean> {
  const enrollments = await getUserEnrollments(clerkUserId, email);

  return enrollments.some(
    (enrollment) => enrollment.status === 'active'
  );
}
