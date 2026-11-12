// lib/authorService.ts

/**
 * Author Economy service layer.
 * Provides helpers for recording sales, handling refunds, and managing withdrawals.
 * All functions are idempotent where required and now delegate to PostgreSQL RPCs.
 */

import { supabaseAdmin } from '@/lib/supabase';

type AuthorWithdrawal = any;

/** Record a sale for the author linked to a product. */
export async function recordAuthorSale(orderId: string): Promise<void> {
  // Fetch all order items for the order
  const { data: items, error: itemsErr } = await supabaseAdmin
    .from('order_items')
    .select('id')
    .eq('order_id', orderId);
  if (itemsErr) throw itemsErr;
  if (!items) return;

  // For each item, invoke the RPC which is idempotent and handles all ledger logic
  for (const item of items) {
    await supabaseAdmin.rpc('record_author_sale', {
      p_order_id: orderId,
      p_order_item_id: item.id,
    });
  }
}

/** Handle a refund event (full refund, idempotent). */
export async function handleRefund(payload: { order_item_id: string }): Promise<void> {
  const { order_item_id } = payload;
  await supabaseAdmin.rpc('handle_refund', { p_order_item_id: order_item_id });
}

/** Request a withdrawal for an author. */
export async function requestWithdrawal(
  authorId: string,
  amount: number,
  requestRef: string,
): Promise<AuthorWithdrawal> {
  const { data, error } = await supabaseAdmin
    .rpc('request_withdrawal', {
      p_author_id: authorId,
      p_amount: amount,
      p_request_ref: requestRef,
    })
    .single();
  if (error) throw error;
  // RPC returns the withdrawal UUID; fetch the full row
  const { data: withdrawal, error: wErr } = await supabaseAdmin
    .from('author_withdrawals')
    .select('*')
    .eq('id', data)
    .single();
  if (wErr) throw wErr;
  return withdrawal as AuthorWithdrawal;
}

/** Admin processing of withdrawal status. */
export async function processWithdrawal(
  withdrawalId: string,
  newStatus: string,
  providerReference?: string,
): Promise<void> {
  const { data: currentWd, error: fetchErr } = await supabaseAdmin
    .from('author_withdrawals')
    .select('*')
    .eq('id', withdrawalId)
    .single();

  if (fetchErr || !currentWd) {
    throw new Error('Withdrawal not found');
  }

  const updatePayload: Record<string, any> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };
  if (providerReference) {
    updatePayload.reference = providerReference;
  }

  const { error } = await supabaseAdmin
    .from('author_withdrawals')
    .update(updatePayload)
    .eq('id', withdrawalId);

  if (error) throw error;

  // If rejected, refund the debit back to the author's transactions ledger
  if (newStatus === 'REJECTED' && currentWd.status !== 'REJECTED') {
    await supabaseAdmin
      .from('author_transactions')
      .insert({
        author_id: currentWd.author_id,
        type: 'CREDIT',
        amount: currentWd.amount,
        currency: 'NGN',
        related_id: currentWd.id,
        description: `Refund for rejected withdrawal request ${currentWd.reference || currentWd.id.slice(0, 8)}`,
        created_at: new Date().toISOString(),
      });
  }
}

/** Get available balance for author using the authoritative ledger. */
export async function getAvailableBalance(authorId: string): Promise<number> {
  const { data: transactions } = await supabaseAdmin
    .from('author_transactions')
    .select('type, amount')
    .eq('author_id', authorId);

  let totalCredits = 0;
  let totalDebitsFromTx = 0;

  (transactions || []).forEach(tx => {
    const amt = Number(tx.amount) || 0;
    const type = (tx.type || '').toUpperCase();
    if (type === 'SALE_CREDIT' || type === 'CREDIT') {
      totalCredits += amt;
    } else if (type === 'WITHDRAWAL_DEBIT' || type === 'DEBIT') {
      totalDebitsFromTx += amt;
    }
  });

  const { data: withdrawals } = await supabaseAdmin
    .from('author_withdrawals')
    .select('amount, status')
    .eq('author_id', authorId)
    .in('status', ['PENDING', 'PROCESSING', 'APPROVED', 'PAID']);

  let totalWithdrawalsAmount = 0;
  (withdrawals || []).forEach(w => {
    totalWithdrawalsAmount += Number(w.amount) || 0;
  });

  const totalDebits = Math.max(totalDebitsFromTx, totalWithdrawalsAmount);
  return Math.max(0, totalCredits - totalDebits);
}
