import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin';
import { processWithdrawal } from '@/lib/authorService';
import { createTransferRecipient, initiateTransfer } from '@/lib/paystack-transfer';
import { createNotification } from '@/lib/notifications';
import { logAdminAction } from '@/lib/auditLog';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/withdrawals
 * Returns all pending withdrawals with author bank details.
 * Admin-only.
 */
export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { data: pending, error } = await supabaseAdmin
      .from('author_withdrawals')
      .select('*, authors(display_name, email, clerk_user_id, author_bank_accounts(bank_name, account_number_text, routing_number_text))')
      .order('requested_at', { ascending: false });

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
 * Body: { withdrawal_id, action: 'approve'|'reject', manual?: boolean, provider_reference?: string }
 * When manual=true: skips Paystack, sets status=PAID, notifies author, writes audit log.
 * Admin-only.
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const { userId: adminUserId } = await auth();

    const body = await request.json();
    const { withdrawal_id, action, provider_reference, manual } = body;

    if (!withdrawal_id || !action) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const isManual = manual === true;

    // Validate action
    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Get withdrawal details including author info
    const { data: withdrawal, error: withdrawalError } = await supabaseAdmin
      .from('author_withdrawals')
      .select('*, authors(display_name, email, clerk_user_id)')
      .eq('id', withdrawal_id)
      .single();

    if (withdrawalError || !withdrawal) {
      return NextResponse.json({ error: 'Withdrawal not found' }, { status: 404 });
    }

    // ─── MANUAL PAID FLOW ───────────────────────────────────────────────────
    if (action === 'approve' && isManual) {
      // 1. Mark withdrawal as PAID directly to bypass RPC validation rules
      const { error: updateError } = await supabaseAdmin
        .from('author_withdrawals')
        .update({ status: 'PAID', processed_at: new Date().toISOString() })
        .eq('id', withdrawal_id);
      
      if (updateError) throw updateError;

      // 2. Send in-app notification to the author
      const authorClerkId = withdrawal.authors?.clerk_user_id;
      if (authorClerkId) {
        try {
          await createNotification({
            title: 'Withdrawal Payment Sent',
            message: 'Your withdrawal of \u20a6' + withdrawal.amount.toLocaleString() + ' (ref: ' + (withdrawal.request_ref || withdrawal_id.slice(0, 8)) + ') has been paid. Please check your bank account.',
            category: 'payment',
            priority: 'important',
            target_type: 'author',
            target_id: authorClerkId,
            action_url: '/author/earnings',
            action_label: 'View Earnings',
            send_email: true,
          });
        } catch (notifErr) {
          console.error('[withdrawals] Failed to send notification:', notifErr);
          // Non-fatal – continue
        }
      }

      // 3. Write audit log
      await logAdminAction({
        adminId: adminUserId || 'unknown',
        action: 'MANUAL_PAID',
        details: {
          withdrawal_id,
          author_id: withdrawal.author_id,
          amount: withdrawal.amount,
          request_ref: withdrawal.request_ref,
        },
      });

      return NextResponse.json({ success: true, withdrawal_id, newStatus: 'PAID' });
    }

    // ─── REJECTION FLOW ─────────────────────────────────────────────────────
    if (action === 'reject') {
      await processWithdrawal(withdrawal_id, 'REJECTED', provider_reference ?? null);

      // Notify author of rejection
      const authorClerkId = withdrawal.authors?.clerk_user_id;
      if (authorClerkId) {
        try {
          await createNotification({
            title: 'Withdrawal Request Rejected',
            message: 'Your withdrawal request of \u20a6' + withdrawal.amount.toLocaleString() + ' (ref: ' + (withdrawal.request_ref || withdrawal_id.slice(0, 8)) + ') has been rejected. Please contact support for assistance.',
            category: 'payment',
            priority: 'important',
            target_type: 'author',
            target_id: authorClerkId,
            action_url: '/author/earnings',
            action_label: 'View Earnings',
            send_email: true,
          });
        } catch (notifErr) {
          console.error('[withdrawals] Failed to send rejection notification:', notifErr);
        }
      }

      await logAdminAction({
        adminId: adminUserId || 'unknown',
        action: 'WITHDRAWAL_REJECTED',
        details: { withdrawal_id, author_id: withdrawal.author_id, amount: withdrawal.amount },
      });

      return NextResponse.json({ success: true, withdrawal_id, newStatus: 'REJECTED' });
    }

    // ─── AUTOMATIC PAYSTACK FLOW (future use when plan is upgraded) ─────────
    if (action === 'approve' && !isManual) {
      try {
        const { data: bankAccount, error: bankError } = await supabaseAdmin
          .from('author_bank_accounts')
          .select('id, bank_name, account_number, routing_number, account_number_text, routing_number_text')
          .eq('author_id', withdrawal.author_id)
          .single();

        if (bankError || !bankAccount) {
          return NextResponse.json({ error: 'Author bank account not found' }, { status: 400 });
        }

        let accountNumber: string;
        let bankCode: string;

        if (bankAccount.account_number_text) {
          accountNumber = bankAccount.account_number_text;
        } else if (typeof bankAccount.account_number === 'string') {
          accountNumber = bankAccount.account_number;
        } else {
          return NextResponse.json({
            error: 'Bank account number not available for transfer',
            message: 'Please update bank account details to enable automatic transfers.',
          }, { status: 400 });
        }

        if (bankAccount.routing_number_text) {
          bankCode = bankAccount.routing_number_text;
        } else if (typeof bankAccount.routing_number === 'string') {
          bankCode = bankAccount.routing_number;
        } else {
          return NextResponse.json({
            error: 'Bank code not available for transfer',
            message: 'Please update bank account details to enable automatic transfers.',
          }, { status: 400 });
        }

        const recipient = await createTransferRecipient(
          accountNumber,
          bankCode,
          withdrawal.authors?.display_name || 'Author'
        );

        const transferRef = provider_reference || ('WD-' + withdrawal_id.slice(0, 8));

        try {
          const transfer = await initiateTransfer(
            recipient.recipient_code,
            withdrawal.amount,
            transferRef,
            'Withdrawal for ' + (withdrawal.authors?.display_name || 'Author')
          );

          await processWithdrawal(withdrawal_id, 'PROCESSING', transfer.data.reference);

          return NextResponse.json({
            success: true,
            withdrawal_id,
            newStatus: 'PROCESSING',
            transfer_reference: transfer.data.reference,
            message: 'Transfer initiated successfully',
          });
        } catch (transferError: any) {
          console.error('Transfer initiation failed:', transferError);

          const isBusinessTierLimitation =
            transferError.message?.includes('business tier') ||
            transferError.message?.includes('starter business') ||
            transferError.message?.includes('Registered Business');

          if (isBusinessTierLimitation) {
            await processWithdrawal(withdrawal_id, 'APPROVED', null);
            return NextResponse.json({
              success: true,
              withdrawal_id,
              newStatus: 'APPROVED',
              message: 'Withdrawal approved (manual transfer required)',
              warning:
                'Paystack business tier limitation: Please upgrade to Registered Business to enable automatic transfers. Process this withdrawal manually.',
              requiresManualTransfer: true,
            });
          }

          await processWithdrawal(withdrawal_id, 'APPROVED', provider_reference);
          return NextResponse.json({
            success: true,
            withdrawal_id,
            newStatus: 'APPROVED',
            warning: 'Transfer initiation failed, withdrawal approved for manual processing',
            error: transferError.message,
          });
        }
      } catch (outerErr: any) {
        console.error('Transfer initiation error:', outerErr);

        const isBusinessTierLimitation =
          outerErr.message?.includes('business tier') ||
          outerErr.message?.includes('starter business') ||
          outerErr.message?.includes('Registered Business');

        if (isBusinessTierLimitation) {
          await processWithdrawal(withdrawal_id, 'APPROVED', null);
          return NextResponse.json({
            success: true,
            withdrawal_id,
            newStatus: 'APPROVED',
            message: 'Withdrawal approved (manual transfer required)',
            warning:
              'Paystack business tier limitation: Please upgrade to Registered Business to enable automatic transfers. Process this withdrawal manually.',
            requiresManualTransfer: true,
          });
        }

        await processWithdrawal(withdrawal_id, 'APPROVED', provider_reference);
        return NextResponse.json({
          success: true,
          withdrawal_id,
          newStatus: 'APPROVED',
          warning: 'Transfer initiation failed, withdrawal approved for manual processing',
          error: outerErr.message,
        });
      }
    }

    return NextResponse.json({ error: 'Unhandled action' }, { status: 400 });
  } catch (e: any) {
    console.error('[POST /api/admin/withdrawals] error:', e);
    return NextResponse.json({ error: e.message || 'Unauthorized or internal error' }, { status: 403 });
  }
}
