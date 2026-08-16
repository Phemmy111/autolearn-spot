/**
 * ALEX Scholarship Context Loader
 * 
 * Retrieves user scholarship application information with detailed status.
 * Uses email lookup as per the scholarship schema design.
 */

import { supabaseAdmin } from '@/lib/supabase';
import { ScholarshipContext, ContextError } from './context-types';

export async function getScholarshipContext(
  authenticatedUserId: string,
  userEmail?: string
): Promise<{ context: ScholarshipContext | null; error: ContextError | null }> {
  try {
    if (!userEmail) {
      return { 
        context: { 
          hasApplications: false, 
          applications: [],
          hasActiveApplication: false,
          applicationStatus: 'No application on file'
        }, 
        error: null 
      };
    }

    // Query scholarship applications for the user's email with more detailed information
    const { data, error } = await supabaseAdmin
      .from('scholarship_applications')
      .select('reference_number, status, created_at, payment_status, payment_date, full_name, motivation')
      .eq('email', userEmail)
      .order('created_at', { ascending: false })
      .limit(1); // Get most recent application

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

    if (!data || data.length === 0) {
      return {
        context: {
          hasApplications: false,
          applications: [],
          hasActiveApplication: false,
          applicationStatus: 'No application submitted'
        },
        error: null
      };
    }

    const application = data[0];
    const hasActiveApplication = ['Submitted', 'Under Review', 'Approved', 'Waiting', 'Pending Verification'].includes(application.status);
    
    // Create a user-friendly status description
    let statusDescription = application.status;
    if (application.status === 'Submitted') {
      statusDescription = 'Application submitted and under review';
    } else if (application.status === 'Waiting') {
      statusDescription = 'Application submitted, awaiting payment verification';
    } else if (application.status === 'Pending Verification') {
      statusDescription = 'Payment verification in progress';
    } else if (application.status === 'Verified') {
      statusDescription = 'Payment verified, application processing';
    }

    const context: ScholarshipContext = {
      hasApplications: true,
      applications: [{
        referenceNumber: application.reference_number,
        status: application.status,
        statusDescription: statusDescription,
        submittedDate: application.created_at,
        paymentStatus: application.payment_status,
        paymentDate: application.payment_date,
        applicantName: application.full_name,
      }],
      hasActiveApplication,
      applicationStatus: statusDescription,
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