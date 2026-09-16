import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin';
import { processWithdrawal } from '@/lib/authorService';
import { createTransferRecipient, initiateTransfer } from '@/lib/paystack-transfer';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/withdrawals
 * Returns all pending withdrawals (status = 'PENDING').
 * Admin‑only.
 */
export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { data: pending, error } = await supabaseAdmin
      .from('author_withdrawals')
      .select('*, authors(display_name, email, clerk_user_id)')
      .eq('status', 'PENDING');
      
    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    return NextResponse.json({ success: true, withdrawals: pending || [] });
  } catch (e: any) {
    console.error('[GET /api/admin/withdrawals] error:', e);
    return NextResponse.json({ error: 'Unauthorized or internal error' }, { status: 403 });
  }
}

/**
 * POST /api/admin/withdrawals
 * Body: { withdrawal_id: string, action: 'approve' | 'reject', provider_reference?: string }
 * Calls authorService.processWithdrawal to transition state.
 * Admin‑only.
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { withdrawal_id, action, provider_reference } = body;
    
    if (!withdrawal_id || !action) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    
    const newStatus = action === 'approve' ? 'APPROVED' : action === 'reject' ? 'REJECTED' : null;
    if (!newStatus) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
    // Get withdrawal details including author info
    const { data: withdrawal, error: withdrawalError } = await supabaseAdmin
      .from('author_withdrawals')
      .select('*, authors(display_name, email)')
      .eq('id', withdrawal_id)
      .single();
    
    if (withdrawalError || !withdrawal) {
      return NextResponse.json({ error: 'Withdrawal not found' }, { status: 404 });
    }
    
    // If approving, initiate Paystack transfer
    if (action === 'approve') {
      try {
        // Get author's bank account
        const { data: bankAccount, error: bankError } = await supabaseAdmin
          .from('author_bank_accounts')
          .select('id, bank_name, account_number, routing_number, account_number_text, routing_number_text')
          .eq('author_id', withdrawal.author_id)
          .single();
        
        if (bankError || !bankAccount) {
          return NextResponse.json({ error: 'Author bank account not found' }, { status: 400 });
        }
        
        // Handle bank account data - use text columns for transfer support
        let accountNumber: string;
        let bankCode: string;
        
        if (bankAccount.account_number_text) {
          accountNumber = bankAccount.account_number_text;
        } else if (typeof bankAccount.account_number === 'string') {
          accountNumber = bankAccount.account_number;
        } else {
          return NextResponse.json({ 
            error: 'Bank account number not available for transfer',
            message: 'Please update bank account details to enable automatic transfers.'
          }, { status: 400 });
        }
        
        if (bankAccount.routing_number_text) {
          bankCode = bankAccount.routing_number_text;
        } else if (typeof bankAccount.routing_number === 'string') {
          bankCode = bankAccount.routing_number;
        } else {
          return NextResponse.json({ 
            error: 'Bank code not available for transfer',
            message: 'Please update bank account details to enable automatic transfers.'
          }, { status: 400 });
        }
        
        // Create transfer recipient
        const recipient = await createTransferRecipient(
          accountNumber,
          bankCode,
          withdrawal.authors?.display_name || 'Author'
        );
        
        // Initiate transfer
        const transferRef = provider_reference || `WD-${withdrawal_id.slice(0, 8)}`;
        let transfer;
        
        try {
          transfer = await initiateTransfer(
            recipient.recipient_code,
            withdrawal.amount,
            transferRef,
            `Withdrawal for ${withdrawal.authors?.display_name || 'Author'}`
          );
          
          // Update withdrawal with provider reference and set to PROCESSING
          await processWithdrawal(withdrawal_id, 'PROCESSING', transfer.data.reference);
          
          return NextResponse.json({ 
            success: true, 
            withdrawal_id, 
            newStatus: 'PROCESSING',
            transfer_reference: transfer.data.reference,
            message: 'Transfer initiated successfully'
          });
        } catch (transferError: any) {
          console.error('Transfer initiation failed:', transferError);
          console.error('Transfer error details:', {
            message: transferError.message,
            stack: transferError.stack,
            recipient: recipient.recipient_code,
            amount: withdrawal.amount
          });
          
          // Still approve the withdrawal but note the transfer error
          await processWithdrawal(withdrawal_id, 'APPROVED', provider_reference);
          return NextResponse.json({ 
            success: true, 
            withdrawal_id, 
            newStatus: 'APPROVED',
            warning: 'Transfer initiation failed, withdrawal approved for manual processing',
            error: transferError.message,
            debugInfo: {
              recipientCode: recipient.recipient_code,
              amount: withdrawal.amount,
              transferRef: transferRef
            }
          });
        }
    } else {
      // Handle rejection
      await processWithdrawal(withdrawal_id, newStatus, provider_reference);
      return NextResponse.json({ success: true, withdrawal_id, newStatus });
    }
  } catch (e: any) {
    console.error('[POST /api/admin/withdrawals] error:', e);
    return NextResponse.json({ error: e.message || 'Unauthorized or internal error' }, { status: 403 });
  }
}
