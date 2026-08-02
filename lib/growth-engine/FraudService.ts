import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export class FraudService {
  /**
   * Logs a potential fraud alert for admin review.
   */
  static async flagActivity(params: {
    type: 'self_referral' | 'duplicate_ip' | 'referral_loop' | 'mass_registration' | 'vpn_abuse' | 'duplicate_payment' | 'suspicious_withdrawal';
    severity: 'low' | 'medium' | 'high';
    description: string;
    userId?: string;
    relatedEntityId?: string;
    metadata?: any;
  }) {
    try {
      await supabaseAdmin.from('fraud_alerts').insert({
        type: params.type,
        severity: params.severity,
        description: params.description,
        user_id: params.userId,
        related_entity_id: params.relatedEntityId,
        metadata: params.metadata,
        status: 'open'
      });
    } catch (err) {
      console.error('[FraudService] Failed to flag activity:', err);
    }
  }

  /**
   * Basic self-referral check
   */
  static async checkSelfReferral(referrerId: string, refereeEmail: string): Promise<boolean> {
    try {
      // Very naive check: if the referee email matches the referrer email
      const { data: user } = await supabaseAdmin.auth.admin.getUserById(referrerId);
      if (user && user.user.email === refereeEmail) {
        await this.flagActivity({
          type: 'self_referral',
          severity: 'high',
          description: `User ${referrerId} attempted to refer their own email: ${refereeEmail}`,
          userId: referrerId,
        });
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  }
}
