/**
 * ALEX Enrollment Context Loader
 * 
 * Safely retrieves user enrollment information using existing enrollment service.
 * Reuses the existing getUserEnrollments function for consistency.
 */

import { supabaseAdmin } from '@/lib/supabase';
import { EnrollmentContext, ContextError } from './context-types';

export async function getEnrollmentContext(
  authenticatedUserId: string,
  userEmail?: string
): Promise<{ context: EnrollmentContext[]; error: ContextError | null }> {
  try {
    // Query enrollments for the authenticated user
    const { data, error } = await supabaseAdmin
      .from('enrollments')
      .select(`
        id,
        learning_product_id,
        status,
        created_at,
        learning_product:learning_products (
          id,
          title,
          slug,
          is_current
        )
      `)
      .eq('clerk_user_id', authenticatedUserId);

    if (error) {
      return {
        context: [],
        error: {
          contextType: 'enrollment',
          error: error.message,
          isCritical: false
        }
      };
    }

    // If no enrollments found by clerk_user_id, try email fallback
    if (!data || data.length === 0) {
      if (userEmail) {
        const { data: emailData, error: emailError } = await supabaseAdmin
          .from('enrollments')
          .select(`
            id,
            learning_product_id,
            status,
            created_at,
            learning_product:learning_products (
              id,
              title,
              slug,
              is_current
            )
          `)
          .eq('email', userEmail);

        if (emailError) {
          return {
            context: [],
            error: {
              contextType: 'enrollment',
              error: emailError.message,
              isCritical: false
            }
          };
        }

        if (emailData && emailData.length > 0) {
          // Link the clerk_user_id for future lookups
          await supabaseAdmin
            .from('enrollments')
            .update({ clerk_user_id: authenticatedUserId })
            .eq('email', userEmail)
            .is('clerk_user_id', null);

          return sanitizeEnrollments(emailData);
        }
      }

      return { context: [], error: null };
    }

    return sanitizeEnrollments(data);
  } catch (error) {
    return {
      context: [],
      error: {
        contextType: 'enrollment',
        error: error instanceof Error ? error.message : 'Unknown error fetching enrollments',
        isCritical: false
      }
    };
  }
}

function sanitizeEnrollments(data: any[]): { context: EnrollmentContext[]; error: null } {
  const context: EnrollmentContext[] = data.map(enrollment => ({
    enrollmentId: enrollment.id,
    courseId: enrollment.learning_product_id,
    courseName: enrollment.learning_product?.title || 'Unknown Course',
    courseSlug: enrollment.learning_product?.slug || 'unknown',
    status: enrollment.status,
    enrolledDate: enrollment.created_at,
    isCurrentCourse: enrollment.learning_product?.is_current || false,
  }));

  return { context, error: null };
}