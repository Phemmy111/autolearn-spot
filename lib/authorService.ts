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
  await supabaseAdmin.rpc('process_withdrawal', {
    p_withdrawal_id: withdrawalId,
    p_new_status: newStatus,
    p_provider_ref: providerReference ?? null,
  });
}

/** Get available balance for author using the authoritative ledger. */
export async function getAvailableBalance(authorId: string): Promise<number> {
  const { data, error } = await supabaseAdmin.rpc('available_balance', {
    p_author_id: authorId,
  });
  if (error) throw error;
  return Number(data);
}
