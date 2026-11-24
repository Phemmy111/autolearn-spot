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

      // Check partner's available earnings (flexible ID lookup)
      const { data: matchedPartners, error: partnerError } = await supabase
        .from('partners')
        .select('id, available_earnings')
        .or(`id.eq.${partnerId},partner_id.eq.${partnerId},user_id.eq.${partnerId}`)
        .limit(1);

      const partner = matchedPartners?.[0];

      if (partnerError || !partner) {
        console.error('Partner not found for withdrawal:', { partnerId, partnerError });
        return { success: false, error: 'Partner not found' };
      }

      const availableNum = Number(partner.available_earnings) || 0;
      if (availableNum < amount) {
        console.error(`Insufficient earnings: ${availableNum} < ${amount}`);
        return { success: false, error: 'Insufficient balance' };
      }

      // Create withdrawal request in author_withdrawals
      const reference = `WD-P-${Date.now().toString(36).toUpperCase()}`;
      const { data: withdrawalData, error: withdrawalError } = await supabase
        .from('author_withdrawals')
        .insert({
          author_id: partner.id,
          amount: amount,
          status: 'PENDING',
          reference: reference
        })
        .select()
        .single();

      if (withdrawalError) {
        console.error('Error creating withdrawal in author_withdrawals:', withdrawalError);
        return { success: false, error: 'Failed to create withdrawal request' };
      }

      // Save or update bank profile for record
      try {
        const { data: existingBp } = await supabase
          .from('partner_bank_profiles')
          .select('id')
          .eq('partner_id', partner.id)
          .maybeSingle();

        if (existingBp) {
          await supabase
            .from('partner_bank_profiles')
            .update({
              bank_name: bankName,
              account_number: accountNumber,
              account_name: accountName,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingBp.id);
        } else {
          await supabase
            .from('partner_bank_profiles')
            .insert({
              partner_id: partner.id,
              bank_name: bankName,
              account_number: accountNumber,
              account_name: accountName
            });
        }
      } catch (be) {
        console.warn('Bank profile save note:', be);
      }

      // Deduct from available earnings
      await supabase
        .from('partners')
        .update({
          available_earnings: Math.max(0, availableNum - amount)
        })
        .eq('id', partner.id);

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
        .from('author_withdrawals')
        .select('*')
        .eq('id', withdrawalId)
        .single();

      if (withdrawalError || !withdrawal) {
        console.error('Withdrawal not found:', withdrawalError);
        return false;
      }

      if ((withdrawal.status || '').toUpperCase() !== 'PENDING') {
        console.error('Withdrawal is not in pending status');
        return false;
      }

      // Update withdrawal status in author_withdrawals
      const { error: updateError } = await supabase
        .from('author_withdrawals')
        .update({
          status: 'PAID',
          reference: paymentReference || withdrawal.reference || `PAID-${Date.now().toString(36).toUpperCase()}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', withdrawalId);

      if (updateError) {
        console.error('Error approving withdrawal:', updateError);
        return false;
      }

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
        .from('author_withdrawals')
        .select('*')
        .eq('id', withdrawalId)
        .single();

      if (withdrawalError || !withdrawal) {
        console.error('Withdrawal not found:', withdrawalError);
        return false;
      }

      // Update withdrawal status
      const { error: updateError } = await supabase
        .from('author_withdrawals')
        .update({
          status: 'PAID',
          reference: paymentReference,
          updated_at: new Date().toISOString()
        })
        .eq('id', withdrawalId);

      if (updateError) {
        console.error('Error marking withdrawal as paid:', updateError);
        return false;
      }

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
        .from('author_withdrawals')
        .select('*')
        .eq('id', withdrawalId)
        .single();

      if (withdrawalError || !withdrawal) {
        console.error('Withdrawal not found:', withdrawalError);
        return false;
      }

      if ((withdrawal.status || '').toUpperCase() !== 'PENDING') {
        console.error('Withdrawal is not in pending status');
        return false;
      }

      // Update withdrawal status
      const { error: updateError } = await supabase
        .from('author_withdrawals')
        .update({
          status: 'REJECTED',
          updated_at: new Date().toISOString()
        })
        .eq('id', withdrawalId);

      if (updateError) {
        console.error('Error rejecting withdrawal:', updateError);
        return false;
      }

      // Refund the amount to partner's available earnings
      const { data: partner } = await supabase
        .from('partners')
        .select('id, available_earnings')
        .or(`id.eq.${withdrawal.author_id},partner_id.eq.${withdrawal.author_id},user_id.eq.${withdrawal.author_id}`)
        .maybeSingle();

      if (partner) {
        await supabase
          .from('partners')
          .update({
            available_earnings: (Number(partner.available_earnings) || 0) + Number(withdrawal.amount || 0)
          })
          .eq('id', partner.id);
      }

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
        .from('author_withdrawals')
        .select('*')
        .or(`author_id.eq.${partnerId}`)
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
        .from('author_withdrawals')
        .select('*')
        .eq('status', 'PENDING')
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