import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export class PartnerCommissionService {
  /**
   * Create commission for partner when student enrolls
   */
  static async createCommission(
    partnerId: string,
    referralId: string,
    enrollmentId: string,
    enrollmentAmount: number
  ): Promise<boolean> {
    try {
      // Get partner commission rate
      const { data: partner, error: partnerError } = await supabase
        .from('partners')
        .select('commission_rate')
        .eq('id', partnerId)
        .single();

      if (partnerError || !partner) {
        console.error('Partner not found:', partnerError);
        return false;
      }

      const commissionAmount = partner.commission_rate;
      const holdingPeriodDays = 7;
      const holdingEndDate = new Date();
      holdingEndDate.setDate(holdingEndDate.getDate() + holdingPeriodDays);

      // Create commission record
      const { error: commissionError } = await supabase
        .from('partner_commissions')
        .insert({
          partner_id: partnerId,
          referral_id: referralId,
          enrollment_id: enrollmentId,
          amount: commissionAmount,
          status: 'pending',
          commission_rate: commissionAmount,
          enrollment_amount: enrollmentAmount,
          holding_period_days: holdingPeriodDays,
          holding_end_date: holdingEndDate.toISOString()
        });

      if (commissionError) {
        console.error('Error creating commission:', commissionError);
        return false;
      }

      // Update partner pending earnings
      await supabase
        .from('partners')
        .update({
          pending_earnings: (await supabase.from('partners').select('pending_earnings').eq('id', partnerId).single()).data?.pending_earnings || 0 + commissionAmount
        })
        .eq('id', partnerId);

      // Log activity
      await supabase.from('partner_activity_logs').insert({
        partner_id: partnerId,
        activity_type: 'commission_created',
        activity_data: {
          referral_id: referralId,
          enrollment_id: enrollmentId,
          amount: commissionAmount,
          status: 'pending'
        }
      });

      // Create notification
      await supabase.from('partner_notifications').insert({
        partner_id: partnerId,
        title: 'New Commission Earned',
        message: `You've earned ₦${commissionAmount} commission from a new enrollment. This will be available for withdrawal after ${holdingPeriodDays} days.`,
        notification_type: 'commission',
        action_url: '/partners/dashboard?tab=earnings'
      });

      return true;
    } catch (error) {
      console.error('Error creating commission:', error);
      return false;
    }
  }

  /**
   * Approve commission after holding period
   */
  static async approveCommission(commissionId: string): Promise<boolean> {
    try {
      const { data: commission, error: commissionError } = await supabase
        .from('partner_commissions')
        .select('*')
        .eq('id', commissionId)
        .single();

      if (commissionError || !commission) {
        console.error('Commission not found:', commissionError);
        return false;
      }

      if (commission.status !== 'pending') {
        console.error('Commission is not in pending status');
        return false;
      }

      // Check if holding period has passed
      const now = new Date();
      const holdingEndDate = new Date(commission.holding_end_date);
      
      if (now < holdingEndDate) {
        console.error('Holding period has not passed');
        return false;
      }

      // Update commission status
      const { error: updateError } = await supabase
        .from('partner_commissions')
        .update({
          status: 'approved',
          approved_at: now.toISOString()
        })
        .eq('id', commissionId);

      if (updateError) {
        console.error('Error approving commission:', updateError);
        return false;
      }

      // The database trigger will automatically update partner totals

      // Log activity
      await supabase.from('partner_activity_logs').insert({
        partner_id: commission.partner_id,
        activity_type: 'commission_approved',
        activity_data: {
          commission_id: commissionId,
          amount: commission.amount
        }
      });

      // Create notification
      await supabase.from('partner_notifications').insert({
        partner_id: commission.partner_id,
        title: 'Commission Approved',
        message: `Your ₦${commission.amount} commission has been approved and is now available for withdrawal.`,
        notification_type: 'commission',
        action_url: '/partners/dashboard?tab=earnings'
      });

      return true;
    } catch (error) {
      console.error('Error approving commission:', error);
      return false;
    }
  }

  /**
   * Reverse commission (for refunds, chargebacks, etc.)
   */
  static async reverseCommission(
    commissionId: string,
    reason: string
  ): Promise<boolean> {
    try {
      const { data: commission, error: commissionError } = await supabase
        .from('partner_commissions')
        .select('*')
        .eq('id', commissionId)
        .single();

      if (commissionError || !commission) {
        console.error('Commission not found:', commissionError);
        return false;
      }

      // Update commission status
      const { error: updateError } = await supabase
        .from('partner_commissions')
        .update({
          status: 'reversed',
          reversal_reason: reason
        })
        .eq('id', commissionId);

      if (updateError) {
        console.error('Error reversing commission:', updateError);
        return false;
      }

      // Adjust partner totals
      if (commission.status === 'approved') {
        await supabase
          .from('partners')
          .update({
            available_balance: (await supabase.from('partners').select('available_balance').eq('id', commission.partner_id).single()).data?.available_balance || 0 - commission.amount,
            total_earnings: (await supabase.from('partners').select('total_earnings').eq('id', commission.partner_id).single()).data?.total_earnings || 0 - commission.amount
          })
          .eq('id', commission.partner_id);
      } else if (commission.status === 'pending') {
        await supabase
          .from('partners')
          .update({
            pending_earnings: (await supabase.from('partners').select('pending_earnings').eq('id', commission.partner_id).single()).data?.pending_earnings || 0 - commission.amount
          })
          .eq('id', commission.partner_id);
      }

      // Log activity
      await supabase.from('partner_activity_logs').insert({
        partner_id: commission.partner_id,
        activity_type: 'commission_reversed',
        activity_data: {
          commission_id: commissionId,
          amount: commission.amount,
          reason: reason
        }
      });

      // Create notification
      await supabase.from('partner_notifications').insert({
        partner_id: commission.partner_id,
        title: 'Commission Reversed',
        message: `Your ₦${commission.amount} commission has been reversed. Reason: ${reason}`,
        notification_type: 'commission',
        action_url: '/partners/dashboard?tab=earnings'
      });

      return true;
    } catch (error) {
      console.error('Error reversing commission:', error);
      return false;
    }
  }

  /**
   * Get earnings summary for a partner
   */
  static async getEarnings(partnerId: string): Promise<{
    availableEarnings: number;
    pendingEarnings: number;
    totalEarned: number;
    monthlyEarnings: number;
  } | null> {
    try {
      const { data: partner, error: partnerError } = await supabase
        .from('partners')
        .select('available_balance, pending_earnings, total_earnings')
        .eq('id', partnerId)
        .single();

      if (partnerError || !partner) {
        console.error('Partner not found:', partnerError);
        return null;
      }

      // Get monthly earnings
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const { data: monthlyCommissions, error: monthlyError } = await supabase
        .from('partner_commissions')
        .select('amount')
        .eq('partner_id', partnerId)
        .in('status', ['approved', 'paid'])
        .gte('created_at', firstDayOfMonth.toISOString());

      const monthlyEarnings = monthlyCommissions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;

      return {
        availableEarnings: partner.available_balance || 0,
        pendingEarnings: partner.pending_earnings || 0,
        totalEarned: partner.total_earnings || 0,
        monthlyEarnings
      };
    } catch (error) {
      console.error('Error getting earnings:', error);
      return null;
    }
  }

  /**
   * Get commission history for a partner
   */
  static async getCommissionHistory(partnerId: string): Promise<any[] | null> {
    try {
      const { data, error } = await supabase
        .from('partner_commissions')
        .select('*')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting commission history:', error);
        return null;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getCommissionHistory:', error);
      return null;
    }
  }

  /**
   * Process pending commissions (cron job function)
   */
  static async processPendingCommissions(): Promise<number> {
    try {
      const { data: pendingCommissions, error } = await supabase
        .from('partner_commissions')
        .select('id')
        .eq('status', 'pending')
        .lte('holding_end_date', new Date().toISOString());

      if (error) {
        console.error('Error fetching pending commissions:', error);
        return 0;
      }

      let approvedCount = 0;
      
      for (const commission of pendingCommissions || []) {
        const approved = await this.approveCommission(commission.id);
        if (approved) {
          approvedCount++;
        }
      }

      return approvedCount;
    } catch (error) {
      console.error('Error processing pending commissions:', error);
      return 0;
    }
  }
}