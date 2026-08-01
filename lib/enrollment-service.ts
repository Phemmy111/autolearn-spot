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
    if (!clerkUserId || !email) {
      return [];
    }

    // Auto-link email enrollment to Clerk account
    await linkEmailToClerkUser(email, clerkUserId);

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

    if (error) {
      console.error('Error fetching user enrollments:', error);
      return [];
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
