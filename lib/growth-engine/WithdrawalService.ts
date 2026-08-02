import { createClient } from '@supabase/supabase-js';
import { logReferralEvent } from '@/lib/audit-logging';
import { Commission } from './CommissionService';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export interface Withdrawal {
  id: string;
  user_id: string;
  user_type: string;
  amount: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  bank_name: string | null;
  account_number: string | null;
  account_name: string | null;
  payment_reference: string | null;
  rejection_reason: string | null;
  admin_notes: string | null;
  processed_by: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

export class WithdrawalService {
  /**
   * Submit a withdrawal request for the user.
   */
  static async submitWithdrawal(params: {
    userId: string;
    amount: number;
    bankName: string;
    accountNumber: string;
    accountName: string;
  }): Promise<{ success: boolean; error?: string; withdrawal?: Withdrawal }> {
    try {
      const minWithdrawalAmount = 2000;
      if (params.amount < minWithdrawalAmount) {
        return { success: false, error: `Minimum withdrawal amount is ₦${minWithdrawalAmount}` };
      }

      // 1. Fetch available commissions that are not currently being withdrawn
      const { data: availableCommissions, error: commError } = await supabaseAdmin
        .from('commissions')
        .select('*')
        .eq('referrer_id', params.userId)
        .eq('status', 'available')
        .order('created_at', { ascending: true });

      if (commError || !availableCommissions || availableCommissions.length === 0) {
        return { success: false, error: 'No available commissions to withdraw' };
      }

      const totalAvailable = availableCommissions.reduce((sum, c) => sum + c.amount, 0);

      if (params.amount > totalAvailable) {
        return { success: false, error: 'Insufficient available balance' };
      }

      // Select commissions to cover the requested amount
      const commissionsToWithdraw: Commission[] = [];
      let currentSum = 0;
      for (const commission of availableCommissions) {
        if (currentSum >= params.amount) break;
        commissionsToWithdraw.push(commission as Commission);
        currentSum += commission.amount;
      }

      // Due to integer commission amounts, we might slightly overshoot the requested amount if partial
      // but in this system commissions are atomic. For simplicity we withdraw exactly the commissions selected.
      const actualWithdrawalAmount = currentSum;

      // 2. Create the withdrawal record
      const { data: withdrawal, error: withdrawError } = await supabaseAdmin
        .from('withdrawals')
        .insert({
          user_id: params.userId,
          user_type: 'student', // Default for now
          amount: actualWithdrawalAmount,
          bank_name: params.bankName,
          account_number: params.accountNumber,
          account_name: params.accountName,
          status: 'pending',
        })
        .select()
        .single();

      if (withdrawError || !withdrawal) {
        console.error('[WithdrawalService] Error creating withdrawal record:', withdrawError);
        return { success: false, error: 'Failed to create withdrawal request' };
      }

      // 3. Mark commissions as withdrawing and link them to withdrawal
      const commissionIds = commissionsToWithdraw.map(c => c.id);
      
      const { error: updateError } = await supabaseAdmin
        .from('commissions')
        .update({ 
          status: 'withdrawing', 
          withdrawal_id: withdrawal.id,
          updated_at: new Date().toISOString()
        })
        .in('id', commissionIds);

      if (updateError) {
        console.error('[WithdrawalService] Error updating commission statuses:', updateError);
        // Ideally we'd rollback, but for now we'll log
      }

      // 4. Insert into junction table
      const junctionData = commissionsToWithdraw.map(c => ({
        withdrawal_id: withdrawal.id,
        commission_id: c.id,
        amount: c.amount
      }));

      await supabaseAdmin.from('withdrawal_commissions').insert(junctionData);

      // 5. Audit log
      await logReferralEvent({
        action: 'withdrawal_requested',
        category: 'status_change',
        user_id: params.userId,
        description: `Withdrawal request for ₦${actualWithdrawalAmount} submitted.`,
        metadata: {
          withdrawal_id: withdrawal.id,
          amount: actualWithdrawalAmount,
          bank_name: params.bankName,
          account_number: params.accountNumber
        },
      });

      return { success: true, withdrawal: withdrawal as Withdrawal };
    } catch (error) {
      console.error('[WithdrawalService] Exception in submitWithdrawal:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Admin approves and pays a withdrawal
   */
  static async approveWithdrawal(params: {
    withdrawalId: string;
    adminId: string;
    paymentReference: string;
    notes?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Get withdrawal
      const { data: withdrawal, error: wError } = await supabaseAdmin
        .from('withdrawals')
        .select('*')
        .eq('id', params.withdrawalId)
        .single();

      if (wError || !withdrawal) return { success: false, error: 'Withdrawal not found' };
      if (withdrawal.status !== 'pending' && withdrawal.status !== 'approved') {
        return { success: false, error: `Cannot pay a withdrawal in ${withdrawal.status} status` };
      }

      // 2. Update withdrawal to paid
      const now = new Date().toISOString();
      const { error: updateError } = await supabaseAdmin
        .from('withdrawals')
        .update({
          status: 'paid',
          payment_reference: params.paymentReference,
          admin_notes: params.notes || null,
          processed_by: params.adminId,
          processed_at: now,
          updated_at: now
        })
        .eq('id', params.withdrawalId);

      if (updateError) return { success: false, error: 'Failed to update withdrawal status' };

      // 3. Update associated commissions to paid
      await supabaseAdmin
        .from('commissions')
        .update({ status: 'paid', updated_at: now })
        .eq('withdrawal_id', params.withdrawalId);

      // 4. Audit log
      await logReferralEvent({
        action: 'withdrawal_paid',
        category: 'status_change',
        user_id: withdrawal.user_id,
        description: `Withdrawal of ₦${withdrawal.amount} paid by admin.`,
        metadata: {
          withdrawal_id: withdrawal.id,
          payment_reference: params.paymentReference,
          admin_id: params.adminId
        },
      });

      return { success: true };
    } catch (error) {
      console.error('[WithdrawalService] Exception in approveWithdrawal:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Admin rejects a withdrawal
   */
  static async rejectWithdrawal(params: {
    withdrawalId: string;
    adminId: string;
    reason: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: withdrawal, error: wError } = await supabaseAdmin
        .from('withdrawals')
        .select('*')
        .eq('id', params.withdrawalId)
        .single();

      if (wError || !withdrawal) return { success: false, error: 'Withdrawal not found' };
      if (withdrawal.status !== 'pending' && withdrawal.status !== 'approved') {
        return { success: false, error: `Cannot reject a withdrawal in ${withdrawal.status} status` };
      }

      const now = new Date().toISOString();
      const { error: updateError } = await supabaseAdmin
        .from('withdrawals')
        .update({
          status: 'rejected',
          rejection_reason: params.reason,
          processed_by: params.adminId,
          processed_at: now,
          updated_at: now
        })
        .eq('id', params.withdrawalId);

      if (updateError) return { success: false, error: 'Failed to update withdrawal status' };

      // Return commissions to 'available' status
      await supabaseAdmin
        .from('commissions')
        .update({ 
          status: 'available', 
          withdrawal_id: null,
          updated_at: now 
        })
        .eq('withdrawal_id', params.withdrawalId);

      await logReferralEvent({
        action: 'withdrawal_rejected',
        category: 'status_change',
        user_id: withdrawal.user_id,
        description: `Withdrawal of ₦${withdrawal.amount} rejected: ${params.reason}`,
        metadata: {
          withdrawal_id: withdrawal.id,
          reason: params.reason,
          admin_id: params.adminId
        },
      });

      return { success: true };
    } catch (error) {
      console.error('[WithdrawalService] Exception in rejectWithdrawal:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * List withdrawals for a user
   */
  static async getUserWithdrawals(userId: string): Promise<Withdrawal[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('withdrawals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[WithdrawalService] Database error in getUserWithdrawals:', error);
        return [];
      }
      return data as Withdrawal[];
    } catch (error) {
      console.error('[WithdrawalService] Exception in getUserWithdrawals:', error);
      return [];
    }
  }

  /**
   * List withdrawals for admin
   */
  static async listWithdrawals(filters: {
    status?: string;
    userId?: string;
  } = {}): Promise<Withdrawal[]> {
    try {
      let query = supabaseAdmin
        .from('withdrawals')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.status) query = query.eq('status', filters.status);
      if (filters.userId) query = query.eq('user_id', filters.userId);

      const { data, error } = await query;
      if (error) {
        console.error('[WithdrawalService] Database error in listWithdrawals:', error);
        return [];
      }
      return data as Withdrawal[];
    } catch (error) {
      console.error('[WithdrawalService] Exception in listWithdrawals:', error);
      return [];
    }
  }
}
