/**
 * ALEX Scholarship Context Loader
 * 
 * Safely retrieves user scholarship application information.
 * Only returns applications for the authenticated user.
 */

import { supabaseAdmin } from '@/lib/supabase';
import { ScholarshipContext, ContextError } from './context-types';

export async function getScholarshipContext(
  authenticatedUserId: string,
  userEmail?: string
): Promise<{ context: ScholarshipContext | null; error: ContextError | null }> {
  try {
    if (!userEmail) {
      return { context: { hasApplications: false, applications: [] }, error: null };
    }

    // Query scholarship applications for the user's email
    const { data, error } = await supabaseAdmin
      .from('scholarship_applications')
      .select('reference_number, status, created_at, payment_status')
      .eq('email', userEmail)
      .order('created_at', { ascending: false });

    if (error) {
      return {
        context: null,
        error: {
          contextType: 'scholarship',
          error: error.message,
          isCritical: false
        }
      };
    }

    const context: ScholarshipContext = {
      hasApplications: !!data && data.length > 0,
      applications: (data || []).map(app => ({
        referenceNumber: app.reference_number,
        status: app.status,
        submittedDate: app.created_at,
        paymentStatus: app.payment_status,
      })),
    };

    return { context, error: null };
  } catch (error) {
    return {
      context: null,
      error: {
        contextType: 'scholarship',
        error: error instanceof Error ? error.message : 'Unknown error fetching scholarship context',
        isCritical: false
      }
    };
  }
}