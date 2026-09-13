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
  activated_at?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  cohort?: {
    id: string;
    name: string;
    slug: string;
    is_current: boolean;
    learning_product?: any;
  };
  // direct join (after migration adds learning_product_id column)
  learning_product?: any;
}

interface EnrollmentUpdateData {
  clerk_user_id: string;
}

/**
 * Automatically link an email-only enrollment to a Clerk User ID
 */
export async function linkEmailToClerkUser(
  email: string,
  clerkUserId: string
): Promise<void> {
  try {
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
 * Given an enrollment record, resolve its learning product.
 * Checks the direct field first (after migration), then falls back through cohort.
 */
function resolveLearningProduct(e: any): any {
  // After migration: direct learning_product field
  if (e.learning_product) {
    return Array.isArray(e.learning_product) ? e.learning_product[0] : e.learning_product;
  }
  // Before migration: learning_product nested inside cohort
  const cohort = Array.isArray(e.cohort) ? e.cohort[0] : e.cohort;
  if (cohort?.learning_product) {
    return Array.isArray(cohort.learning_product) ? cohort.learning_product[0] : cohort.learning_product;
  }
  return null;
}

/**
 * Helper to check if an enrollment is expired and update DB if so
 */
async function processEnrollmentExpiry(enrollments: any[]): Promise<any[]> {
  const now = new Date().getTime();
  const validEnrollments = [];

  for (const e of enrollments) {
    if (e.status !== 'active') {
      validEnrollments.push(e);
      continue;
    }

    let isExpired = false;

    const lp = resolveLearningProduct(e);
    if (lp && lp.access_duration_days && e.activated_at) {
      const activatedTime = new Date(e.activated_at).getTime();
      const durationMs = lp.access_duration_days * 24 * 60 * 60 * 1000;
      if (now > activatedTime + durationMs) {
        isExpired = true;
      }
    }

    if (isExpired) {
      console.log(`[enrollment-service] Enrollment ${e.id} has expired.`);
      await supabaseAdmin
        .from('enrollments')
        .update({ status: 'expired' })
        .eq('id', e.id);

      e.status = 'expired';
    }

    validEnrollments.push(e);
  }

  return validEnrollments;
}

/** The select string for enrollment queries — joins cohort and its learning_product */
const ENROLLMENT_SELECT = `
  *,
  cohort:cohorts (
    id,
    name,
    slug,
    is_current,
    learning_product:learning_products (
      id,
      title,
      slug,
      description,
      thumbnail_url,
      product_type,
      access_duration_days
    )
  ),
  learning_product:learning_products (
    id,
    title,
    slug,
    description,
    thumbnail_url,
    product_type,
    access_duration_days
  )
`;

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

    // Auto-link email enrollment to Clerk account
    if (email) {
      await linkEmailToClerkUser(email, clerkUserId);
    }

    const { data, error } = await supabaseAdmin
      .from('enrollments')
      .select(ENROLLMENT_SELECT)
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
          .select(ENROLLMENT_SELECT)
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

        if (emailData && emailData.length > 0) {
          console.log('[getUserEnrollments] Found enrollment by email, linking clerk_user_id');
          await linkEmailToClerkUser(email, clerkUserId);
          return await processEnrollmentExpiry((emailData ?? []) as any[]);
        }
      }
    }

    return await processEnrollmentExpiry((data ?? []) as any[]);
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

  // Allow access for both active courses AND purchased-but-not-yet-started courses
  return enrollments.some(
    (enrollment) => enrollment.status === 'active' || enrollment.status === 'not_started'
  );
}

export { resolveLearningProduct };
