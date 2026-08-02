import { createClient } from '@supabase/supabase-js';
import { logReferralEvent } from '@/lib/audit-logging';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export class FraudService {
  /**
   * Log a new fraud alert
   */
  static async logFraudAlert(params: {
    alertType: 'self_referral' | 'duplicate_commission' | 'suspicious_pattern' | 'rate_limit_exceeded' | 'payment_anomaly';
    severity: 'low' | 'medium' | 'high' | 'critical';
    userId?: string;
    referralCode?: string;
    paymentReference?: string;
    ipAddress?: string;
    description: string;
    metadata?: any;
  }) {
    try {
      const { data, error } = await supabaseAdmin
        .from('fraud_alerts')
        .insert({
          alert_type: params.alertType,
          severity: params.severity,
          user_id: params.userId,
          referral_code: params.referralCode,
          payment_reference: params.paymentReference,
          ip_address: params.ipAddress,
          description: params.description,
          metadata: params.metadata,
          status: 'open'
        });

      if (error) {
        console.error('[FraudService] Failed to insert fraud alert:', error);
      }

      await logReferralEvent({
        action: 'fraud_alert_created',
        category: 'validation_error',
        user_id: params.userId,
        description: `Fraud alert: ${params.description}`,
        metadata: { type: params.alertType, severity: params.severity }
      });

      return { success: !error };
    } catch (err) {
      console.error('[FraudService] logFraudAlert err:', err);
      return { success: false };
    }
  }
}
