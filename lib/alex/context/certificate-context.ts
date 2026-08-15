/**
 * ALEX Certificate Context Loader
 * 
 * Safely retrieves user certificate information.
 * Only returns certificates for the authenticated user.
 */

import { supabaseAdmin } from '@/lib/supabase';
import { CertificateContext, ContextError } from './context-types';

export async function getCertificateContext(
  authenticatedUserId: string
): Promise<{ context: CertificateContext | null; error: ContextError | null }> {
  try {
    // Query certificates for the authenticated user
    const { data, error } = await supabaseAdmin
      .from('certificates')
      .select(`
        certificate_code,
        cohort_id,
        user_name,
        issued_at,
        revoked_at,
        verification_url,
        cohort:cohorts (
          name
        )
      `)
      .eq('user_id', authenticatedUserId)
      .order('issued_at', { ascending: false });

    if (error) {
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
        cohortName: (cert.cohort as any)?.name || 'Unknown Cohort',
        issuedDate: cert.issued_at,
        isRevoked: !!cert.revoked_at,
        verificationUrl: cert.verification_url,
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