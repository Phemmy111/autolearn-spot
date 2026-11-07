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
 * Automatically link email-only enrollments to a Clerk User ID
 */
export async function linkEmailToClerkUser(
  emailOrEmails: string | string[],
  clerkUserId: string
): Promise<void> {
  try {
    if (!clerkUserId) return;
    const emails = (Array.isArray(emailOrEmails) ? emailOrEmails : [emailOrEmails])
      .filter(Boolean)
      .map(e => e.trim().toLowerCase());

    if (emails.length === 0) return;

    for (const email of emails) {
      // 1. Link unlinked or matching enrollments
      const { data, error } = await supabaseAdmin
        .from('enrollments')
        .update({ clerk_user_id: clerkUserId })
        .ilike('email', email)
        .or(`clerk_user_id.is.null,clerk_user_id.eq.${clerkUserId}`)
        .select('id');

      if (error) {
        console.error(`Failed to link enrollment for ${email} to Clerk user:`, error);
      } else if (data && data.length > 0) {
        console.log(`Successfully linked ${data.length} enrollment(s) for ${email} to Clerk user ${clerkUserId}`);
      }

      // 2. Link guest orders with this email to clerkUserId
      await supabaseAdmin
        .from('orders')
        .update({ user_id: clerkUserId })
        .ilike('customer_email', email)
        .like('user_id', 'guest_%');

      // 3. Link author conversations that were targeted by email
      await supabaseAdmin
        .from('author_conversations')
        .update({ student_id: clerkUserId })
        .ilike('student_id', email);
    }
  } catch (error) {
    console.error('Error in linkEmailToClerkUser:', error);
  }
}

/**
 * Given an enrollment record, resolve its learning product (direct join only).
 */
function resolveLearningProduct(e: any): any {
  if (!e.learning_product) return null;
  return Array.isArray(e.learning_product) ? e.learning_product[0] : e.learning_product;
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

/** The select string for enrollment queries — joins directly to learning_products */
const ENROLLMENT_SELECT = `
  *,
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
    emailOrEmails?: string | string[]
  ): Promise<Enrollment[]> => {
    const emails = (Array.isArray(emailOrEmails) ? emailOrEmails : [emailOrEmails])
      .filter(Boolean)
      .map(e => e!.trim().toLowerCase());

    console.log('[getUserEnrollments] Input values:', { clerkUserId, emails });

    if (!clerkUserId) {
      console.log('[getUserEnrollments] Missing clerkUserId, returning empty');
      return [];
    }

    // Auto-link any unlinked enrollments with these emails to the Clerk account
    if (emails.length > 0) {
      await linkEmailToClerkUser(emails, clerkUserId);
    }

    // 1. Fetch by clerk_user_id
    const { data: byClerkId, error: clerkError } = await supabaseAdmin
      .from('enrollments')
      .select(ENROLLMENT_SELECT)
      .eq('clerk_user_id', clerkUserId);

    if (clerkError) {
      console.error('Error fetching user enrollments by clerk_user_id:', clerkError);
    }

    // 2. Fetch by emails (fallback / safety net for race conditions or unlinked records)
    const byEmail: any[] = [];
    for (const em of emails) {
      const { data: emailData, error: emailError } = await supabaseAdmin
        .from('enrollments')
        .select(ENROLLMENT_SELECT)
        .ilike('email', em);

      if (emailError) {
        console.error(`Error fetching enrollments by email ${em}:`, emailError);
      } else if (emailData && emailData.length > 0) {
        byEmail.push(...emailData);
      }
    }

    // 3. Deduplicate enrollments by ID
    const mergedMap = new Map<string, any>();
    (byClerkId || []).forEach(e => mergedMap.set(e.id, e));
    byEmail.forEach(e => {
      if (!mergedMap.has(e.id)) {
        mergedMap.set(e.id, e);
      }
    });

    const combined = Array.from(mergedMap.values());
    console.log('[getUserEnrollments] Total resolved enrollments:', combined.length);

    return await processEnrollmentExpiry(combined as any[]);
  }
);

/**
 * Check if the user has at least one active enrollment
 */
export async function hasActiveEnrollment(
  clerkUserId: string,
  emailOrEmails?: string | string[]
): Promise<boolean> {
  const enrollments = await getUserEnrollments(clerkUserId, emailOrEmails);

  // Allow access for both active courses AND purchased-but-not-yet-started courses
  return enrollments.some(
    (enrollment) => enrollment.status === 'active' || enrollment.status === 'not_started'
  );
}

export { resolveLearningProduct };
