import { createClient } from '@supabase/supabase-js';
import { logReferralEvent } from '@/lib/audit-logging';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/** Commission amount by referrer type (in Naira) */
const COMMISSION_AMOUNTS: Record<string, number> = {
  student: 1000,
  campus_ambassador: 1000,
  partner_ambassador: 2000,
};

/** Holding period in days before commission becomes available */
const HOLDING_PERIOD_DAYS = 7;

export interface Commission {
  id: string;
  referrer_id: string;
  referrer_type: string;
  referee_email: string;
  referral_code: string;
  payment_reference: string;
  amount: number;
  status: 'pending' | 'available' | 'withdrawing' | 'paid' | 'reversed';
  holding_period_ends_at: string | null;
  reversal_reason: string | null;
  created_at: string;
  updated_at: string;
}

export class CommissionService {
  /**
   * Creates a commission after successful payment verification.
   * Idempotent: if a commission already exists for this payment_reference, it is returned without creating a duplicate.
   */
  static async createCommission(params: {
    paymentReference: string;
    referralCode: string;
    refereeEmail: string;
  }): Promise<Commission | null> {
    try {
      // 1. Idempotency check — return existing commission for this payment reference
      const { data: existing } = await supabaseAdmin
        .from('commissions')
        .select('*')
        .eq('payment_reference', params.paymentReference)
        .single();

      if (existing) {
        console.log(`[CommissionService] Commission already exists for payment ${params.paymentReference}`);
        return existing as Commission;
      }

      // 2. Look up the referral code to find the referrer
      const { data: referralCode, error: codeError } = await supabaseAdmin
        .from('referral_codes')
        .select('owner_id, code, status')
        .eq('code', params.referralCode)
        .single();

      if (codeError || !referralCode) {
        console.error('[CommissionService] Referral code not found:', params.referralCode);
        return null;
      }

      if (referralCode.status !== 'Active') {
        console.log('[CommissionService] Referral code is not active:', params.referralCode);
        return null;
      }

      // 3. Determine referrer type and commission amount
      // For now all codes belong to students; future milestones will add ambassador types
      const referrerType = 'student';
      const amount = COMMISSION_AMOUNTS[referrerType] || 1000;

      // 4. Calculate holding period end
      const holdingEnd = new Date();
      holdingEnd.setDate(holdingEnd.getDate() + HOLDING_PERIOD_DAYS);

      // 5. Insert commission
      const { data: commission, error: insertError } = await supabaseAdmin
        .from('commissions')
        .insert({
          referrer_id: referralCode.owner_id,
          referrer_type: referrerType,
          referee_email: params.refereeEmail,
          referral_code: params.referralCode,
          payment_reference: params.paymentReference,
          amount,
          status: 'pending',
          holding_period_ends_at: holdingEnd.toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        // Handle unique constraint violation (duplicate payment_reference) gracefully
        if (insertError.code === '23505') {
          console.log(`[CommissionService] Duplicate commission prevented for payment ${params.paymentReference}`);
          const { data: dup } = await supabaseAdmin
            .from('commissions')
            .select('*')
            .eq('payment_reference', params.paymentReference)
            .single();
          return dup as Commission | null;
        }
        console.error('[CommissionService] Failed to create commission:', insertError);
        return null;
      }

      // 6. Audit log
      await logReferralEvent({
        action: 'commission_created',
        category: 'enrollment',
        user_id: referralCode.owner_id,
        referral_code: params.referralCode,
        description: `Commission of ₦${amount} created for referral code ${params.referralCode} (payment: ${params.paymentReference})`,
        metadata: {
          commission_id: commission.id,
          referee_email: params.refereeEmail,
          amount,
          holding_period_ends_at: holdingEnd.toISOString(),
        },
      });

      console.log(`[CommissionService] Commission created: ₦${amount} for ${referralCode.owner_id}`);
      return commission as Commission;
    } catch (error) {
      console.error('[CommissionService] Exception in createCommission:', error);
      return null;
    }
  }

  /**
   * Calculates earnings for a user.
   * Returns pendingEarnings (commissions in 'pending' status) and
   * availableEarnings (commissions in 'available' status, past holding period).
   */
  static async getEarnings(userId: string): Promise<{ pendingEarnings: number; availableEarnings: number }> {
    try {
      // Pending commissions (still in holding period)
      const { data: pendingRows } = await supabaseAdmin
        .from('commissions')
        .select('amount')
        .eq('referrer_id', userId)
        .eq('status', 'pending');

      const pendingEarnings = (pendingRows || []).reduce((sum, row) => sum + (row.amount || 0), 0);

      // Available commissions (holding period passed, ready for withdrawal)
      const { data: availableRows } = await supabaseAdmin
        .from('commissions')
        .select('amount')
        .eq('referrer_id', userId)
        .eq('status', 'available');

      const availableEarnings = (availableRows || []).reduce((sum, row) => sum + (row.amount || 0), 0);

      return { pendingEarnings, availableEarnings };
    } catch (error) {
      console.error('[CommissionService] Exception in getEarnings:', error);
      return { pendingEarnings: 0, availableEarnings: 0 };
    }
  }

  /**
   * Releases commissions whose holding period has expired.
   * Transitions status from 'pending' → 'available'.
   * Safe to call multiple times (idempotent).
   */
  static async releaseMaturedCommissions(): Promise<number> {
    try {
      const now = new Date().toISOString();

      const { data, error } = await supabaseAdmin
        .from('commissions')
        .update({ status: 'available', updated_at: now })
        .eq('status', 'pending')
        .lte('holding_period_ends_at', now)
        .select('id');

      if (error) {
        console.error('[CommissionService] Failed to release matured commissions:', error);
        return 0;
      }

      const count = data?.length || 0;
      if (count > 0) {
        console.log(`[CommissionService] Released ${count} matured commission(s)`);
      }
      return count;
    } catch (error) {
      console.error('[CommissionService] Exception in releaseMaturedCommissions:', error);
      return 0;
    }
  }

  /**
   * Reverses a commission (e.g. due to payment chargeback or fraud).
   */
  static async reverseCommission(paymentReference: string, reason: string): Promise<boolean> {
    try {
      const { data: commission } = await supabaseAdmin
        .from('commissions')
        .select('id, status, referrer_id, referral_code, amount')
        .eq('payment_reference', paymentReference)
        .single();

      if (!commission) {
        console.log(`[CommissionService] No commission found for payment ${paymentReference}`);
        return false;
      }

      // Cannot reverse already paid commissions
      if (commission.status === 'paid') {
        console.log(`[CommissionService] Cannot reverse paid commission ${commission.id}`);
        return false;
      }

      if (commission.status === 'reversed') {
        console.log(`[CommissionService] Commission ${commission.id} already reversed`);
        return true;
      }

      const { error } = await supabaseAdmin
        .from('commissions')
        .update({
          status: 'reversed',
          reversal_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', commission.id);

      if (error) {
        console.error('[CommissionService] Failed to reverse commission:', error);
        return false;
      }

      await logReferralEvent({
        action: 'commission_reversed',
        category: 'enrollment',
        user_id: commission.referrer_id,
        referral_code: commission.referral_code,
        description: `Commission ₦${commission.amount} reversed: ${reason} (payment: ${paymentReference})`,
        metadata: {
          commission_id: commission.id,
          reason,
        },
      });

      console.log(`[CommissionService] Commission ${commission.id} reversed: ${reason}`);
      return true;
    } catch (error) {
      console.error('[CommissionService] Exception in reverseCommission:', error);
      return false;
    }
  }

  /**
   * Lists all commissions for admin view with optional filters.
   */
  static async listCommissions(filters: {
    referrerId?: string;
    status?: string;
    referralCode?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<Commission[]> {
    try {
      let query = supabaseAdmin
        .from('commissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.referrerId) query = query.eq('referrer_id', filters.referrerId);
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.referralCode) query = query.eq('referral_code', filters.referralCode);
      if (filters.startDate) query = query.gte('created_at', filters.startDate.toISOString());
      if (filters.endDate) query = query.lte('created_at', filters.endDate.toISOString());

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
