import { createClient } from '@supabase/supabase-js';
import { logReferralEvent } from '@/lib/audit-logging';
import { FraudService } from './FraudService';
import { PartnerEmailService } from './PartnerEmailService';
import { NotificationService } from './NotificationService';
import { getCommissionRate } from '@/lib/commission';
import type { EventCategory } from '@/lib/audit-logging';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export interface Commission {
  id: string;
  referrer_id: string;
  referrer_type: 'student' | 'community' | 'influencer';
  referee_email: string;
  referral_code: string;
  payment_reference: string;
  amount: number;
  status: 'pending' | 'available' | 'withdrawing' | 'paid' | 'reversed';
  holding_period_ends_at: string | null;
  reversal_reason: string | null;
  withdrawal_id: string | null;
  created_at: string;
  updated_at: string;
}

export class CommissionService {
  /**
   * Creates a commission after a verified payment.
   */
  static async recordCommission(params: {
    referrerId: string;
    referrerType: 'student' | 'community' | 'influencer';
    refereeEmail: string;
    referralCode: string;
    paymentReference: string;
    courseAmount: number; // Amount paid for the course
    ipAddress?: string; // For fraud detection
  }): Promise<{ success: boolean; error?: string; commission?: Commission }> {
    try {
      // Only create commissions for Direct Enrollment payments, not scholarship (₦5,000)
      if (params.courseAmount === 5000) {
        return { success: false, error: 'Commissions not eligible for scholarship payments' };
      }

      // Run fraud checks
      const fraudCheck = await FraudService.runFraudChecks({
        referrerId: params.referrerId,
        refereeEmail: params.refereeEmail,
        ipAddress: params.ipAddress,
        referralCode: params.referralCode
      });

      if (fraudCheck.hasFraud) {
        console.error('[CommissionService] Fraud detected:', fraudCheck.alerts);
        return { success: false, error: `Fraud detected: ${fraudCheck.alerts.join(', ')}` };
      }

      // Get commission rate from database configuration
      const amount = await getCommissionRate(params.referrerType);
      console.log(`[CommissionService] Commission rate for ${params.referrerType}: ₦${amount}`);
      
      // Standard 7-day holding period
      const holdingPeriodEndsAt = new Date();
      holdingPeriodEndsAt.setDate(holdingPeriodEndsAt.getDate() + 7);

      const { data, error } = await supabaseAdmin
        .from('commissions')
        .insert({
          referrer_id: params.referrerId,
          referrer_type: params.referrerType,
          referee_email: params.refereeEmail,
          referral_code: params.referralCode,
          payment_reference: params.paymentReference,
          amount,
          status: 'pending',
          holding_period_ends_at: holdingPeriodEndsAt.toISOString()
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return { success: false, error: 'Commission already recorded for this payment reference' };
        }
        console.error('[CommissionService] Insert error:', error);
        return { success: false, error: 'Database error while recording commission' };
      }

      await logReferralEvent({
        action: 'commission_created',
        category: 'payment' as EventCategory,
        user_id: params.referrerId,
        description: `Commission of ₦${amount} created for referral ${params.referralCode} (₦8,000 course purchase)`,
        metadata: {
          commissionId: data.id,
          refereeEmail: params.refereeEmail,
          paymentReference: params.paymentReference,
          courseAmount: params.courseAmount
        }
      });

      // Send commission earned email
      // Get partner email
      const { data: partner } = await supabaseAdmin
        .from('partners')
        .select('email, full_name')
        .eq('id', params.referrerId)
        .single();

      if (partner) {
        await PartnerEmailService.sendCommissionEarnedEmail(
          partner.email,
          partner.full_name,
          amount,
          params.refereeEmail
        );

        // Create notification
        await NotificationService.createNotification({
          partnerId: params.referrerId,
          type: 'commission_earned',
          title: `Commission Earned: ₦${amount}`,
          message: `You earned ₦${amount} from a new referral. This will be available for withdrawal after 7 days.`,
          metadata: { amount, refereeEmail: params.refereeEmail, commissionId: data.id }
        });
      }

      return { success: true, commission: data as Commission };
    } catch (error) {
      console.error('[CommissionService] Exception in recordCommission:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Moves commissions from 'pending' to 'available' if their holding period has ended.
   */
  static async releaseMaturedCommissions(): Promise<void> {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabaseAdmin
        .from('commissions')
        .update({ status: 'available', updated_at: now })
        .eq('status', 'pending')
        .lte('holding_period_ends_at', now)
        .select();

      if (error) {
        console.error('[CommissionService] Error releasing commissions:', error);
        return;
      }

      if (data && data.length > 0) {
        for (const commission of data) {
          await logReferralEvent({
            action: 'commission_matured',
            category: 'status_change' as EventCategory,
            user_id: commission.referrer_id,
            description: `Commission ₦${commission.amount} matured and is now available`,
            metadata: { commissionId: commission.id }
          });

          // Send commission released email
          const { data: partner } = await supabaseAdmin
            .from('partners')
            .select('email, full_name')
            .eq('id', commission.referrer_id)
            .single();

          if (partner) {
            await PartnerEmailService.sendCommissionReleasedEmail(
              partner.email,
              partner.full_name,
              commission.amount
            );

            // Create notification
            await NotificationService.createNotification({
              partnerId: commission.referrer_id,
              type: 'commission_released',
              title: `Commission Available: ₦${commission.amount}`,
              message: `Your commission of ₦${commission.amount} is now available for withdrawal.`,
              metadata: { amount: commission.amount, commissionId: commission.id }
            });
          }
        }
      }
    } catch (error) {
      console.error('[CommissionService] Exception in releaseMaturedCommissions:', error);
    }
  }

  /**
   * Returns aggregated earnings for a specific referrer
   */
  static async getEarnings(referrerId: string): Promise<{
    pendingEarnings: number;
    availableEarnings: number;
    withdrawnEarnings: number;
    lifetimeEarnings: number;
  }> {
    try {
      const { data, error } = await supabaseAdmin
        .from('commissions')
        .select('amount, status')
        .eq('referrer_id', referrerId);

      if (error || !data) {
        return { pendingEarnings: 0, availableEarnings: 0, withdrawnEarnings: 0, lifetimeEarnings: 0 };
      }

      let pending = 0;
      let available = 0;
      let withdrawn = 0;
      let lifetime = 0;

      for (const commission of data) {
        // Exclude reversed from lifetime
        if (commission.status !== 'reversed') {
          lifetime += commission.amount;
        }

        if (commission.status === 'pending') pending += commission.amount;
        if (commission.status === 'available') available += commission.amount;
        if (commission.status === 'paid') withdrawn += commission.amount;
      }

      return {
        pendingEarnings: pending,
        availableEarnings: available,
        withdrawnEarnings: withdrawn,
        lifetimeEarnings: lifetime
      };
    } catch (error) {
      console.error('[CommissionService] Exception in getEarnings:', error);
      return { pendingEarnings: 0, availableEarnings: 0, withdrawnEarnings: 0, lifetimeEarnings: 0 };
    }
  }

  /**
   * Reverses a commission (e.g., if payment was refunded/charged back)
   */
  static async reverseCommission(paymentReference: string, reason: string): Promise<boolean> {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabaseAdmin
        .from('commissions')
        .update({ 
          status: 'reversed', 
          reversal_reason: reason,
          updated_at: now
        })
        .eq('payment_reference', paymentReference)
        .select()
        .single();

      if (error || !data) return false;

      await logReferralEvent({
        action: 'commission_reversed',
        category: 'status_change',
        user_id: data.referrer_id,
        description: `Commission for payment ${paymentReference} reversed: ${reason}`,
        metadata: { commissionId: data.id, reason }
      });

      return true;
    } catch (error) {
      console.error('[CommissionService] Exception in reverseCommission:', error);
      return false;
    }
  }

  /**
   * List all commissions with optional filters
   */
  static async listCommissions(filters?: {
    referrerId?: string;
    status?: string;
    referralCode?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Commission[]> {
    try {
      let query = supabaseAdmin
        .from('commissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.referrerId) query = query.eq('referrer_id', filters.referrerId);
      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.referralCode) query = query.eq('referral_code', filters.referralCode);
      if (filters?.startDate) query = query.gte('created_at', filters.startDate.toISOString());
      if (filters?.endDate) query = query.lte('created_at', filters.endDate.toISOString());

      const { data, error } = await query;
      if (error) {
        console.error('[CommissionService] Database error in listCommissions:', error);
        return [];
      }
      return data as Commission[];
    } catch (error) {
      console.error('[CommissionService] Exception in listCommissions:', error);
      return [];
    }
  }
}
