import { supabaseAdmin } from '@/lib/supabase';
import { cache } from 'react';

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
  cohort?: {
    id: string;
    name: string;
    slug: string;
    is_current: boolean;
  };
}

/**
 * Automatically link an email-only enrollment to a Clerk User ID
 */
export async function linkEmailToClerkUser(email: string, clerkUserId: string): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from('enrollments')
    .update({ clerk_user_id: clerkUserId })
    .eq('email', email)
    .is('clerk_user_id', null)
    .select();

  if (error) {
    console.error('Failed to link enrollment to clerk user:', error);
  } else if (data && data.length > 0) {
    console.log(`Successfully linked ${data.length} enrollments to Clerk user ${clerkUserId}`);
  }
}

/**
 * Fetch all enrollments for a given clerk user (and auto-link if needed by email)
 */
export const getUserEnrollments = cache(async (clerkUserId: string, email: string): Promise<Enrollment[]> => {
  if (!clerkUserId || !email) return [];

  // Always attempt to auto-link pending enrollments for this email
  await linkEmailToClerkUser(email, clerkUserId);

  // Fetch enrollments by clerk_user_id
  const { data, error } = await supabaseAdmin
    .from('enrollments')
    .select(`
      *,
      cohort:cohorts (id, name, slug, is_current)
    `)
    .eq('clerk_user_id', clerkUserId);

  if (error) {
    console.error('Error fetching user enrollments:', error);
    return [];
  }

  return data as Enrollment[];
});

/**
 * Helper to check if user has at least one active enrollment
 */
export async function hasActiveEnrollment(clerkUserId: string, email: string): Promise<boolean> {
  const enrollments = await getUserEnrollments(clerkUserId, email);
  return enrollments.some(e => e.status === 'active');
}
