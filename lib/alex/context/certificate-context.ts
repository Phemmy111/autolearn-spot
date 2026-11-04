/**
 * ALEX Certificate Context Loader
 * 
 * Safely retrieves user certificate information.
 * Only returns certificates for the authenticated user.
 */

import { supabaseAdmin } from '@/lib/supabase';
import { CertificateContext, ContextError } from './context-types';

export async function getCertificateContext(
  authenticatedUserId: string,
  userEmail?: string
): Promise<{ context: CertificateContext | null; error: ContextError | null }> {
  try {
    let query = supabaseAdmin
      .from('certificates')
      .select('certificate_code, learning_product_id, course_title, user_name, user_email, issued_at');

    if (userEmail) {
      query = query.or(`user_id.eq.${authenticatedUserId},user_email.eq.${userEmail}`);
    } else {
      query = query.eq('user_id', authenticatedUserId);
    }

    const { data, error } = await query.order('issued_at', { ascending: false });

    if (error) {
      console.warn('Error fetching certificates:', error.message);
      return {
        context: null,
        error: {
          contextType: 'certificate',
          error: error.message,
          isCritical: false
        }
      };
    }

    const context: CertificateContext = {
      hasCertificate: !!data && data.length > 0,
      certificates: (data || []).map(cert => ({
        certificateCode: cert.certificate_code,
        courseName: cert.course_title || 'AI Automation with n8n',
        issuedDate: cert.issued_at,
        isRevoked: false,
        verificationUrl: `/verify-certificate?code=${cert.certificate_code}`,
      })),
    };

    return { context, error: null };
  } catch (error) {
    return {
      context: null,
      error: {
        contextType: 'certificate',
        error: error instanceof Error ? error.message : 'Unknown error fetching certificate context',
        isCritical: false
      }
    };
  }
}