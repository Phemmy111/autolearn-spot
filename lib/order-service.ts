/**
 * lib/order-service.ts
 * Server-side order lifecycle for Phase 4 marketplace checkout.
 */

import { supabaseAdmin } from '@/lib/supabase';
import { CartDetails } from './cart-service';

export interface Order {
  id: string;
  user_id: string;
  order_ref: string;
  currency: string;
  subtotal: number;
  total: number;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';
  payment_provider: string;
  provider_ref: string | null;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  learning_product_id: string;
  product_title: string;
  price_snapshot: number;
  created_at: string;
}

/**
 * Create a new PENDING order + order_items snapshot from the given cart.
 * Returns the created order, or null on failure.
 */
export async function createOrderFromCart(
  userId: string,
  cart: CartDetails
): Promise<Order | null> {
  if (!cart.items || cart.items.length === 0) return null;

  // Re-fetch prices server-side (do NOT trust CartDetails if it could be stale)
  const productIds = cart.items.map((i) => i.learning_product_id);
  const { data: products, error: productErr } = await supabaseAdmin
    .from('learning_products')
    .select('id, title, price, currency')
    .in('id', productIds);

  if (productErr || !products || products.length !== productIds.length) {
    console.error('order-service: failed to re-fetch products', productErr);
    return null;
  }

  const subtotal = products.reduce((sum, p) => sum + p.price, 0);
  // total = subtotal (no platform fee in Phase 4; extend here if fees are added)
  const total = subtotal;
  const orderRef = crypto.randomUUID();

  const { data: order, error: orderErr } = await supabaseAdmin
    .from('orders')
    .insert({
      user_id: userId,
      order_ref: orderRef,
      currency: cart.currency,
      subtotal,
      total,
      status: 'PENDING',
      payment_provider: 'paystack',
      provider_ref: null,
    })
    .select()
    .single();

  if (orderErr || !order) {
    console.error('order-service: createOrderFromCart insert error', orderErr);
    return null;
  }

  // Insert order_items as a snapshot
  const orderItems = products.map((p) => ({
    order_id: order.id,
    learning_product_id: p.id,
    product_title: p.title,
    price_snapshot: p.price,
  }));

  const { error: itemsErr } = await supabaseAdmin.from('order_items').insert(orderItems);
  if (itemsErr) {
    console.error('order-service: createOrderFromCart order_items error', itemsErr);
    // Rollback order to avoid orphaned rows
    await supabaseAdmin.from('orders').delete().eq('id', order.id);
    return null;
  }

  return order as Order;
}

/**
 * Attach the Paystack provider reference to a PENDING order.
 */
export async function setOrderProviderRef(
  orderId: string,
  providerRef: string
): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('orders')
    .update({ provider_ref: providerRef, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('status', 'PENDING');

  if (error) {
    console.error('order-service: setOrderProviderRef error', error);
    return false;
  }
  return true;
}

/**
 * Look up an order by its Paystack provider_ref.
 */
export async function getOrderByProviderRef(providerRef: string): Promise<Order | null> {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('provider_ref', providerRef)
    .maybeSingle();

  if (error) {
    console.error('order-service: getOrderByProviderRef error', error);
    return null;
  }
  return (data as Order) ?? null;
}

/**
 * Fetch all order_items for an order.
 */
export async function getOrderItems(orderId: string): Promise<OrderItem[]> {
  const { data, error } = await supabaseAdmin
    .from('order_items')
    .select('*')
    .eq('order_id', orderId);

  if (error) {
    console.error('order-service: getOrderItems error', error);
    return [];
  }
  return (data as OrderItem[]) ?? [];
}

/**
 * Mark an order as PAID and record paid_at timestamp.
 */
export async function markOrderPaid(orderId: string): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from('orders')
    .update({
      status: 'PAID',
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (error) {
    console.error('order-service: markOrderPaid error', error);
    return false;
  }
  return true;
}
