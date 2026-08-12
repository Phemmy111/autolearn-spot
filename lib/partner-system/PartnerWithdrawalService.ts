import { createClient } from '@supabase/supabase-js';
import { getPartnershipSettings } from '@/lib/partnership-settings';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export class PartnerWithdrawalService {
  /**
   * Create withdrawal request
   */
  static async createWithdrawal(
    partnerId: string,
    amount: number,
    bankName: string,
    accountNumber: string,
    accountName: string
  ): Promise<{ success: boolean; error?: string; withdrawal?: any }> {
    try {
      // Check minimum withdrawal amount from database settings
      const partnershipSettings = await getPartnershipSettings();
      const MIN_WITHDRAWAL = partnershipSettings.minWithdrawal;
      if (amount < MIN_WITHDRAWAL) {
        console.error(`Amount below minimum: ${amount} < ${MIN_WITHDRAWAL}`);
        return { success: false, error: `Minimum withdrawal amount is ₦${MIN_WITHDRAWAL.toLocaleString()}` };
      }

      // Check partner's available balance
      const { data: partner, error: partnerError } = await supabase
        .from('partners')
        .select('available_balance')
        .eq('id', partnerId)
        .single();

      if (partnerError || !partner) {
        console.error('Partner not found:', partnerError);
        return { success: false, error: 'Partner not found' };
      }

      if (partner.available_balance < amount) {
        console.error(`Insufficient balance: ${partner.available_balance} < ${amount}`);
        return { success: false, error: 'Insufficient balance' };
      }

      // Create withdrawal request
      const { data: withdrawalData, error: withdrawalError } = await supabase
        .from('partner_withdrawals')
        .insert({
          partner_id: partnerId,
          amount: amount,
          status: 'pending',
          bank_name: bankName,
          account_number: accountNumber,
          account_name: accountName
        })
        .select()
        .single();

      if (withdrawalError) {
        console.error('Error creating withdrawal:', withdrawalError);
        return { success: false, error: 'Failed to create withdrawal request' };
      }

      // Deduct from available balance (temporarily)
      await supabase
        .from('partners')
        .update({
          available_balance: partner.available_balance - amount
        })
        .eq('id', partnerId);

      // Log activity
      await supabase.from('partner_activity_logs').insert({
        partner_id: partnerId,
        activity_type: 'withdrawal_requested',
        activity_data: {
          amount: amount,
          bank_name: bankName,
          account_number: accountNumber
        }
      });

      // Create notification
      await supabase.from('partner_notifications').insert({
        partner_id: partnerId,
        title: 'Withdrawal Request Submitted',
        message: `Your withdrawal request of ₦${amount} has been submitted and is being reviewed.`,
        notification_type: 'withdrawal',
        action_url: '/partners/dashboard?tab=withdrawals'
      });

      return { success: true, withdrawal: withdrawalData };
    } catch (error) {
      console.error('Error creating withdrawal:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Approve withdrawal request
   */
  static async approveWithdrawal(
    withdrawalId: string,
    approvedBy: string,
    paymentReference?: string
  ): Promise<boolean> {
    try {
      const { data: withdrawal, error: withdrawalError } = await supabase
        .from('partner_withdrawals')
        .select('*')
        .eq('id', withdrawalId)
        .single();

      if (withdrawalError || !withdrawal) {
        console.error('Withdrawal not found:', withdrawalError);
        return false;
      }

      if (withdrawal.status !== 'pending') {
        console.error('Withdrawal is not in pending status');
        return false;
      }

      // Update withdrawal status
      const { error: updateError } = await supabase
        .from('partner_withdrawals')
        .update({
          status: 'approved',
          approved_by: approvedBy,
          approved_at: new Date().toISOString(),
          payment_reference: paymentReference
        })
        .eq('id', withdrawalId);

      if (updateError) {
        console.error('Error approving withdrawal:', updateError);
        return false;
      }

      // The database trigger will handle updating partner totals

      // Log activity
      await supabase.from('partner_activity_logs').insert({
        partner_id: withdrawal.partner_id,
        activity_type: 'withdrawal_approved',
        activity_data: {
          withdrawal_id: withdrawalId,
          amount: withdrawal.amount,
          approved_by: approvedBy
        }
      });

      // Create notification
      await supabase.from('partner_notifications').insert({
        partner_id: withdrawal.partner_id,
        title: 'Withdrawal Approved',
        message: `Your withdrawal request of ₦${withdrawal.amount} has been approved. Payment will be processed shortly.`,
        notification_type: 'withdrawal',
        action_url: '/partners/dashboard?tab=withdrawals'
      });

      return true;
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      return false;
    }
  }

  /**
   * Mark withdrawal as paid
   */
  static async markWithdrawalAsPaid(
    withdrawalId: string,
    paymentReference: string
  ): Promise<boolean> {
    try {
      const { data: withdrawal, error: withdrawalError } = await supabase
        .from('partner_withdrawals')
        .select('*')
        .eq('id', withdrawalId)
        .single();

      if (withdrawalError || !withdrawal) {
        console.error('Withdrawal not found:', withdrawalError);
        return false;
      }

      if (withdrawal.status !== 'approved') {
        console.error('Withdrawal is not in approved status');
        return false;
      }

      // Update withdrawal status
      const { error: updateError } = await supabase
        .from('partner_withdrawals')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          payment_reference: paymentReference
        })
        .eq('id', withdrawalId);

      if (updateError) {
        console.error('Error marking withdrawal as paid:', updateError);
        return false;
      }

      // Log activity
      await supabase.from('partner_activity_logs').insert({
        partner_id: withdrawal.partner_id,
        activity_type: 'withdrawal_paid',
        activity_data: {
          withdrawal_id: withdrawalId,
          amount: withdrawal.amount,
          payment_reference: paymentReference
        }
      });

      // Create notification
      await supabase.from('partner_notifications').insert({
        partner_id: withdrawal.partner_id,
        title: 'Withdrawal Paid',
        message: `Your withdrawal of ₦${withdrawal.amount} has been paid. Reference: ${paymentReference}`,
        notification_type: 'withdrawal',
        action_url: '/partners/dashboard?tab=withdrawals'
      });

      return true;
    } catch (error) {
      console.error('Error marking withdrawal as paid:', error);
      return false;
    }
  }

  /**
   * Reject withdrawal request
   */
  static async rejectWithdrawal(
    withdrawalId: string,
    approvedBy: string,
    reason: string
  ): Promise<boolean> {
    try {
      const { data: withdrawal, error: withdrawalError } = await supabase
        .from('partner_withdrawals')
        .select('*')
        .eq('id', withdrawalId)
        .single();

      if (withdrawalError || !withdrawal) {
        console.error('Withdrawal not found:', withdrawalError);
        return false;
      }

      if (withdrawal.status !== 'pending') {
        console.error('Withdrawal is not in pending status');
        return false;
      }

      // Update withdrawal status
      const { error: updateError } = await supabase
        .from('partner_withdrawals')
        .update({
          status: 'rejected',
          approved_by: approvedBy,
          rejection_reason: reason
        })
        .eq('id', withdrawalId);

      if (updateError) {
        console.error('Error rejecting withdrawal:', updateError);
        return false;
      }

      // Refund the amount to partner's available balance
      await supabase
        .from('partners')
        .update({
          available_balance: (await supabase.from('partners').select('available_balance').eq('id', withdrawal.partner_id).single()).data?.available_balance || 0 + withdrawal.amount
        })
        .eq('id', withdrawal.partner_id);

      // Log activity
      await supabase.from('partner_activity_logs').insert({
        partner_id: withdrawal.partner_id,
        activity_type: 'withdrawal_rejected',
        activity_data: {
          withdrawal_id: withdrawalId,
          amount: withdrawal.amount,
          reason: reason
        }
      });

      // Create notification
      await supabase.from('partner_notifications').insert({
        partner_id: withdrawal.partner_id,
        title: 'Withdrawal Rejected',
        message: `Your withdrawal request of ₦${withdrawal.amount} has been rejected. Reason: ${reason}`,
        notification_type: 'withdrawal',
        action_url: '/partners/dashboard?tab=withdrawals'
      });

      return true;
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      return false;
    }
  }

  /**
   * Get withdrawal history for a partner
   */
  static async getWithdrawalHistory(partnerId: string): Promise<any[] | null> {
    try {
      const { data, error } = await supabase
        .from('partner_withdrawals')
        .select('*')
        .eq('partner_id', partnerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting withdrawal history:', error);
        return null;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getWithdrawalHistory:', error);
      return null;
    }
  }

  /**
   * Get pending withdrawals for admin review
   */
  static async getPendingWithdrawals(): Promise<any[] | null> {
    try {
      const { data, error } = await supabase
        .from('partner_withdrawals')
        .select(`
          *,
          partners (
            id,
            partner_id,
            full_name,
            email
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting pending withdrawals:', error);
        return null;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPendingWithdrawals:', error);
      return null;
    }
  }

  /**
   * Get bank profile for a partner
   */
  static async getBankProfile(partnerId: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('partner_bank_profiles')
        .select('*')
        .eq('partner_id', partnerId)
        .single();

      if (error) {
        console.error('Error getting bank profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getBankProfile:', error);
      return null;
    }
  }

  /**
   * Save bank profile for a partner
   */
  static async saveBankProfile(
    partnerId: string,
    bankName: string,
    accountNumber: string,
    accountName: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('partner_bank_profiles')
        .upsert({
          partner_id: partnerId,
          bank_name: bankName,
          account_number: accountNumber,
          account_name: accountName,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'partner_id'
        });

      if (error) {
        console.error('Error saving bank profile:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in saveBankProfile:', error);
      return false;
    }
  }
}