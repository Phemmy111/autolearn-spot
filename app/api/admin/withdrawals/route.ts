import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin';
import { processWithdrawal } from '@/lib/authorService';
import { createTransferRecipient, initiateTransfer } from '@/lib/paystack-transfer';
import { createNotification } from '@/lib/notifications';
import { logAdminAction } from '@/lib/auditLog';
import { EmailService } from '@/lib/email-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/withdrawals
 * Returns all withdrawals with author and bank details.
 * Admin-only.
 */
export async function GET(request: Request) {
  try {
    await requireAdmin();

    // 1. Fetch withdrawals ordered by created_at DESC
    const { data: withdrawals, error: wdError } = await supabaseAdmin
      .from('author_withdrawals')
      .select('*')
      .order('created_at', { ascending: false });

    if (wdError) {
      console.error('Error fetching author withdrawals:', wdError);
      throw wdError;
    }

    if (!withdrawals || withdrawals.length === 0) {
      return NextResponse.json({ success: true, withdrawals: [] });
    }

    // 2. Fetch associated authors and bank accounts
    const authorIds = Array.from(new Set(withdrawals.map(w => w.author_id).filter(Boolean)));

    const { data: authors, error: authorsError } = await supabaseAdmin
      .from('authors')
      .select('id, display_name, email, clerk_user_id')
      .in('id', authorIds);

    if (authorsError) {
      console.warn('Warning fetching authors for withdrawals:', authorsError);
    }

    const { data: bankAccounts, error: bankError } = await supabaseAdmin
      .from('author_bank_accounts')
      .select('author_id, bank_name, bank_code, account_number, account_name, recipient_code')
      .in('author_id', authorIds);

    if (bankError) {
      console.warn('Warning fetching author bank accounts:', bankError);
    }

    const authorMap = new Map((authors || []).map(a => [a.id, a]));
    const bankMap = new Map((bankAccounts || []).map(b => [b.author_id, b]));

    // 3. Map into the shape expected by the frontend
    const mapped = withdrawals.map(w => {
      const author = authorMap.get(w.author_id);
      const bank = bankMap.get(w.author_id);

      return {
        id: w.id,
        request_ref: w.reference || (w.id ? w.id.slice(0, 8) : 'WD-REF'),
        amount: Number(w.amount) || 0,
        requested_at: w.created_at,
        created_at: w.created_at,
        updated_at: w.updated_at,
        status: w.status || 'PENDING',
        author_id: w.author_id,
        transfer_code: w.transfer_code || null,
        authors: {
          display_name: author?.display_name || 'Author',
          email: author?.email || '',
          clerk_user_id: author?.clerk_user_id,
          author_bank_accounts: bank || null,
        },
      };
    });

    return NextResponse.json({ success: true, withdrawals: mapped });
  } catch (e: any) {
    console.error('[GET /api/admin/withdrawals] error:', e);
    return NextResponse.json({ success: false, error: e.message || 'Unauthorized or internal error' }, { status: 403 });
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

    // 1. Fetch withdrawal details
    const { data: withdrawal, error: withdrawalError } = await supabaseAdmin
      .from('author_withdrawals')
      .select('*')
      .eq('id', withdrawal_id)
      .single();

    if (withdrawalError || !withdrawal) {
      return NextResponse.json({ error: 'Withdrawal not found' }, { status: 404 });
    }

    // 2. Fetch author details
    const { data: author } = await supabaseAdmin
      .from('authors')
      .select('id, display_name, email, clerk_user_id')
      .eq('id', withdrawal.author_id)
      .maybeSingle();

    const authorClerkId = author?.clerk_user_id;
    const authorEmail = author?.email;
    const authorName = author?.display_name || 'Author';
    const withdrawalRef = withdrawal.reference || withdrawal_id.slice(0, 8);

    // ─── MANUAL PAID FLOW ───────────────────────────────────────────────────
    if (action === 'approve' && isManual) {
      // 1. Mark withdrawal as PAID
      const { error: updateError } = await supabaseAdmin
        .from('author_withdrawals')
        .update({ status: 'PAID', updated_at: new Date().toISOString() })
        .eq('id', withdrawal_id);
      
      if (updateError) throw updateError;

      // 2. Send in-app notification to the author
      if (authorClerkId) {
        try {
          await createNotification({
            title: 'Withdrawal Payment Sent',
            message: `Your withdrawal of ₦${Number(withdrawal.amount).toLocaleString()} (ref: ${withdrawalRef}) has been paid. Please check your bank account.`,
            category: 'payment',
            priority: 'important',
            target_type: 'author',
            target_id: authorClerkId,
            action_url: '/author/withdrawals',
            action_label: 'View Withdrawals',
            send_email: true,
          });
        } catch (notifErr) {
          console.error('[withdrawals] Failed to send notification:', notifErr);
        }
      }

      // 3. Send dedicated email notification to author
      if (authorEmail) {
        try {
          await EmailService.sendWithdrawalPaidNotification(
            authorEmail,
            authorName,
            Number(withdrawal.amount),
            withdrawalRef
          );
        } catch (emailErr) {
          console.error('[withdrawals] Failed to send email notification:', emailErr);
        }
      }

      // 4. Write audit log
      await logAdminAction({
        adminId: adminUserId || 'unknown',
        action: 'MANUAL_PAID',
        details: {
          withdrawal_id,
          author_id: withdrawal.author_id,
          amount: withdrawal.amount,
          request_ref: withdrawalRef,
        },
      });

      return NextResponse.json({ success: true, withdrawal_id, newStatus: 'PAID' });
    }

    // ─── REJECTION FLOW ─────────────────────────────────────────────────────
    if (action === 'reject') {
      await processWithdrawal(withdrawal_id, 'REJECTED', provider_reference ?? null);

      // Notify author of rejection
      if (authorClerkId) {
        try {
          await createNotification({
            title: 'Withdrawal Request Rejected',
            message: `Your withdrawal request of ₦${Number(withdrawal.amount).toLocaleString()} (ref: ${withdrawalRef}) has been rejected. The funds have been returned to your available balance. Please contact support if you need assistance.`,
            category: 'payment',
            priority: 'important',
            target_type: 'author',
            target_id: authorClerkId,
            action_url: '/author/withdrawals',
            action_label: 'View Withdrawals',
            send_email: true,
          });
        } catch (notifErr) {
          console.error('[withdrawals] Failed to send rejection notification:', notifErr);
        }
      }

      // Send dedicated email notification to author
      if (authorEmail) {
        try {
          await EmailService.sendWithdrawalRejectedNotification(
            authorEmail,
            authorName,
            Number(withdrawal.amount),
            withdrawalRef
          );
        } catch (emailErr) {
          console.error('[withdrawals] Failed to send rejection email:', emailErr);
        }
      }

      await logAdminAction({
        adminId: adminUserId || 'unknown',
        action: 'WITHDRAWAL_REJECTED',
        details: { withdrawal_id, author_id: withdrawal.author_id, amount: withdrawal.amount },
      });

      return NextResponse.json({ success: true, withdrawal_id, newStatus: 'REJECTED' });
    }

    // ─── AUTOMATIC PAYSTACK FLOW ───────────────────────────────────────────
    if (action === 'approve' && !isManual) {
      try {
        const { data: bankAccount, error: bankError } = await supabaseAdmin
          .from('author_bank_accounts')
          .select('id, bank_name, bank_code, account_number, account_name, recipient_code')
          .eq('author_id', withdrawal.author_id)
          .maybeSingle();

        if (bankError || !bankAccount) {
          return NextResponse.json({ error: 'Author bank account not found' }, { status: 400 });
        }

        const accountNumber = bankAccount.account_number;
        const bankCode = bankAccount.bank_code;

        if (!accountNumber || !bankCode) {
          return NextResponse.json({
            error: 'Bank account number or bank code not available for transfer',
            message: 'Please update bank account details to enable automatic transfers.',
          }, { status: 400 });
        }

        const accountHolderName = bankAccount.account_name || authorName;

        const recipient = bankAccount.recipient_code 
          ? { recipient_code: bankAccount.recipient_code }
          : await createTransferRecipient(
              accountNumber,
              bankCode,
              accountHolderName
            );

        const transferRef = provider_reference || ('WD-' + withdrawal_id.slice(0, 8));

        try {
          const transfer = await initiateTransfer(
            recipient.recipient_code,
            withdrawal.amount,
            transferRef,
            'Withdrawal for ' + authorName
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
