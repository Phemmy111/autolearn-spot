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

    const lp = resolveLearningProduct(e);
    // If course or student is lifetime, it never expires
    const isLifetime = (lp && (lp.access_duration_days === null || lp.access_duration_days === undefined || lp.access_duration_days === 0)) ||
      (e.expires_at && new Date(e.expires_at).getFullYear() >= 2099);

    if (isLifetime) {
      validEnrollments.push(e);
      continue;
    }

    let isExpired = false;

    if (e.expires_at) {
      // Prioritize explicit enrollment expires_at date
      if (now > new Date(e.expires_at).getTime()) {
        isExpired = true;
      }
    } else if (lp && lp.access_duration_days && e.activated_at) {
      // Fallback to activated_at + access_duration_days
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
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('id', e.id);

      e.status = 'expired';
    }

    validEnrollments.push(e);
  }

  return validEnrollments;
}

/**
 * Extend or reactivate course access for a student.
 * Can add N days (from now if elapsed/expired, or from current expiry if active),
 * or grant permanent lifetime access.
 */
export async function extendEnrollmentAccess({
  enrollmentId,
  daysToAdd,
  isLifetime,
}: {
  enrollmentId: string;
  daysToAdd?: number;
  isLifetime?: boolean;
}): Promise<{
  success: boolean;
  expires_at: string | null;
  status: string;
  days_left: number | null;
  is_lifetime: boolean;
  message: string;
}> {
  const { data: enrollment, error } = await supabaseAdmin
    .from('enrollments')
    .select(`
      id,
      status,
      activated_at,
      expires_at,
      learning_product_id,
      learning_product:learning_products (
        id,
        title,
        access_duration_days
      )
    `)
    .eq('id', enrollmentId)
    .single();

  if (error || !enrollment) {
    throw new Error('Enrollment not found');
  }

  const now = Date.now();
  const product = Array.isArray(enrollment.learning_product)
    ? enrollment.learning_product[0]
    : enrollment.learning_product;
  const courseDurationDays = product?.access_duration_days;

  let newExpiresAt: string | null = null;
  let newStatus = 'active';
  let message = '';

  if (isLifetime) {
    newExpiresAt = '2099-12-31T23:59:59.000Z';
    newStatus = 'active';
    message = 'Permanent Lifetime Access granted successfully';
  } else if (typeof daysToAdd === 'number' && daysToAdd > 0) {
    // 1. Determine current expiry time if any
    let currentExpiryTime: number | null = null;
    if (enrollment.expires_at) {
      currentExpiryTime = new Date(enrollment.expires_at).getTime();
    } else if (enrollment.activated_at && courseDurationDays) {
      currentExpiryTime = new Date(enrollment.activated_at).getTime() + (courseDurationDays * 24 * 60 * 60 * 1000);
    }

    // 2. If access has already expired / elapsed (or was never started / inactive), start from NOW:
    let baseTime = now;
    const isCurrentlyExpired = enrollment.status === 'expired' || (currentExpiryTime !== null && currentExpiryTime <= now);

    if (!isCurrentlyExpired && currentExpiryTime && currentExpiryTime > now && enrollment.status === 'active') {
      // Still active: extend on top of existing remaining time!
      baseTime = currentExpiryTime;
      message = `Extended access by ${daysToAdd} day${daysToAdd !== 1 ? 's' : ''} on top of remaining time`;
    } else {
      // Expired / elapsed or newly reactivated: start from today!
      baseTime = now;
      message = `Reactivated access for ${daysToAdd} day${daysToAdd !== 1 ? 's' : ''} starting today`;
    }

    const calculatedTime = baseTime + (daysToAdd * 24 * 60 * 60 * 1000);
    newExpiresAt = new Date(calculatedTime).toISOString();
    newStatus = 'active';
  } else {
    throw new Error('Please specify either days to add or lifetime access');
  }

  // Update enrollment in database
  const { error: updateError } = await supabaseAdmin
    .from('enrollments')
    .update({
      expires_at: newExpiresAt,
      status: newStatus,
      activated_at: enrollment.activated_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', enrollmentId);

  if (updateError) {
    console.error('[extendEnrollmentAccess] DB error:', updateError);
    throw new Error('Failed to update student enrollment access');
  }

  const is_lifetime = isLifetime || (newExpiresAt ? new Date(newExpiresAt).getFullYear() >= 2099 : false);
  const days_left = is_lifetime
    ? null
    : newExpiresAt
    ? Math.max(0, Math.ceil((new Date(newExpiresAt).getTime() - now) / (1000 * 60 * 60 * 24)))
    : null;

  return {
    success: true,
    expires_at: newExpiresAt,
    status: newStatus,
    days_left,
    is_lifetime,
    message,
  };
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
