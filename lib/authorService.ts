// lib/authorService.ts

/**
 * Author Economy service layer.
 * Provides helpers for recording sales, handling refunds, and managing withdrawals.
 * All functions are idempotent where required and now delegate to PostgreSQL RPCs.
 */

import { supabaseAdmin } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type AuthorWithdrawal = Database['public']['Tables']['author_withdrawals']['Insert'];

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


/**
 * Author Economy service layer.
 * Provides helpers for recording sales, handling refunds, and managing withdrawals.
 * All functions are idempotent where required and now delegate to PostgreSQL RPCs.
 */

import { supabaseAdmin } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type AuthorWithdrawal = Database['public']['Tables']['author_withdrawals']['Insert'];

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


/**
 * Author Economy service layer.
 * Provides helpers for recording sales, handling refunds, and managing withdrawals.
 * All functions are idempotent where required and now delegate to PostgreSQL RPCs.
 */

import { supabaseAdmin } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type AuthorWithdrawal = Database['public']['Tables']['author_withdrawals']['Insert'];

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


/**
 * Author Economy service layer.
 * Provides helpers for recording sales, handling refunds, and managing withdrawals.
 * All functions are idempotent where required.
 */

import { supabaseAdmin } from '@/lib/supabase';
import { Database } from '@/types/supabase';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderItem = Database['public']['Tables']['order_items']['Row'];
type LearningProduct = Database['public']['Tables']['learning_products']['Row'];

type AuthorSale = Database['public']['Tables']['author_sales']['Insert'];
type AuthorTransaction = Database['public']['Tables']['author_transactions']['Insert'];

type AuthorWithdrawal = Database['public']['Tables']['author_withdrawals']['Insert'];

/** Record a sale for the author linked to a product. */
export async function recordAuthorSale(orderId: string): Promise<void> {
  const { data: order, error: orderErr } = await supabaseAdmin
    .from('orders')
    .select('id, status')
    .eq('id', orderId)
    .single();
  if (orderErr) throw orderErr;
  if (order?.status !== 'paid') return;

  const { data: items, error: itemsErr } = await supabaseAdmin
    .from('order_items')
    .select('id, product_id, price_snapshot')
    .eq('order_id', orderId);
  if (itemsErr) throw itemsErr;
  if (!items) return;

  for (const item of items) {
    const { data: existingSale } = await supabaseAdmin
      .from('author_sales')
      .select('id')
      .eq('order_item_id', item.id)
      .single();
    if (existingSale) continue;

    const { data: product, error: prodErr } = await supabaseAdmin
      .from('learning_products')
      .select('id, commission_rate, author_id')
      .eq('id', item.product_id)
      .single();
    if (prodErr) throw prodErr;
    if (!product?.author_id) continue;

    const gross = Number(item.price_snapshot);
    const commissionRate = Number(product.commission_rate ?? 0.1);
    const commission = Number((gross * commissionRate).toFixed(4));
    const net = Number((gross - commission).toFixed(2));

    const sale: AuthorSale = {
      order_id: orderId,
      order_item_id: item.id,
      product_id: product.id,
      author_id: product.author_id,
      gross_amount: gross,
      commission_amount: commission,
      net_amount: net,
      currency: 'NGN',
    };

    const { data: saleRows, error: saleErr } = await supabaseAdmin
      .from('author_sales')
      .insert(sale)
      .select()
      .single();
    if (saleErr) throw saleErr;
    const saleId = saleRows.id;

    const transaction: AuthorTransaction = {
      author_id: product.author_id,
      type: 'SALE_CREDIT',
      amount: net,
      currency: 'NGN',
      related_id: saleId,
      description: `Sale credit for order ${orderId}, item ${item.id}`,
    };
    const { error: txErr } = await supabaseAdmin.from('author_transactions').insert(transaction);
    if (txErr) throw txErr;
  }
}

/** Handle a refund event. */
export async function handleRefund(payload: { order_item_id: string; amount: number }): Promise<void> {
  const { order_item_id, amount } = payload;
  const { data: sale, error: saleErr } = await supabaseAdmin
    .from('author_sales')
    .select('id, author_id')
    .eq('order_item_id', order_item_id)
    .single();
  if (saleErr) throw saleErr;
  if (!sale) return;

  const { data: existing } = await supabaseAdmin
    .from('author_transactions')
    .select('id')
    .eq('type', 'REFUND_DEBIT')
    .eq('related_id', sale.id)
    .single();
  if (existing) return;

  const transaction: AuthorTransaction = {
    author_id: sale.author_id,
    type: 'REFUND_DEBIT',
    amount,
    currency: 'NGN',
    related_id: sale.id,
    description: `Refund for order item ${order_item_id}`,
  };
  const { error } = await supabaseAdmin.from('author_transactions').insert(transaction);
  if (error) throw error;
}

/** Request a withdrawal for an author. */
export async function requestWithdrawal(authorId: string, amount: number): Promise<AuthorWithdrawal> {
  const { data: earnings, error: earnErr } = await supabaseAdmin
    .from('author_earnings')
    .select('total_net')
    .eq('author_id', authorId)
    .single();
  if (earnErr) throw earnErr;
  if ((earnings?.total_net ?? 0) < amount) throw new Error('Insufficient balance');

  const withdrawal: AuthorWithdrawal = {
    author_id: authorId,
    amount,
    currency: 'NGN',
    status: 'PENDING',
    provider: 'PAYSTACK',
  };
  const { data, error } = await supabaseAdmin.from('author_withdrawals').insert(withdrawal).select();
  if (error) throw error;
  return data[0];
}

/** Admin processing of withdrawal status. */
export async function processWithdrawal(withdrawalId: string, newStatus: string, providerReference?: string): Promise<void> {
  const allowed = ['APPROVED', 'REJECTED', 'PROCESSING', 'PAID', 'FAILED'];
  if (!allowed.includes(newStatus)) throw new Error('Invalid status');

  const updates: Partial<AuthorWithdrawal> = { status: newStatus as any };
  if (providerReference) updates.provider_reference = providerReference;

  const { error } = await supabaseAdmin.from('author_withdrawals').update(updates).eq('id', withdrawalId);
  if (error) throw error;
}

/** Get available balance for author. */
export async function getAvailableBalance(authorId: string): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from('author_earnings')
    .select('total_net')
    .eq('author_id', authorId)
    .single();
  if (error) throw error;
  return Number(data?.total_net ?? 0);
}
