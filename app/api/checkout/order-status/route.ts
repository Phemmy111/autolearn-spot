/**
 * GET /api/checkout/order-status?reference=...
 *
 * Verifies payment confirmation for browser success pages.
 * Ensures the browser never tracks a "Purchase" event on unverified or failed visits.
 * Returns order details and the exact deterministic event_id for Meta deduplication.
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get('reference') || searchParams.get('trxref');

  if (!reference) {
    return NextResponse.json(
      { verified: false, error: 'Reference parameter is required' },
      { status: 400 }
    );
  }

  try {
    // 1. Check cart orders
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('id, order_ref, status, total, currency, provider_ref')
      .or(`provider_ref.eq.${reference},order_ref.eq.${reference}`)
      .maybeSingle();

    if (order && order.status === 'PAID') {
      // Fetch order items for contents breakdown
      const { data: items } = await supabaseAdmin
        .from('order_items')
        .select('learning_product_id, product_title, price_snapshot')
        .eq('order_id', order.id);

      const contents = (items || []).map((i) => ({
        id: i.learning_product_id,
        title: i.product_title,
        item_price: i.price_snapshot,
        quantity: 1,
      }));

      return NextResponse.json({
        verified: true,
        orderId: order.id,
        eventId: `purchase_${order.id}`,
        total: order.total,
        currency: order.currency || 'NGN',
        numItems: contents.length || 1,
        contentIds: contents.map((c) => c.id),
        contents,
      });
    }

    // 2. Check direct enrollments
    const { data: enrollment } = await supabaseAdmin
      .from('enrollments')
      .select('id, payment_ref, amount_paid, status, learning_product_id, learning_products(id, title)')
      .eq('payment_ref', reference)
      .maybeSingle();

    if (enrollment && enrollment.status === 'active') {
      const lp = enrollment.learning_products as any;
      const contentId = enrollment.learning_product_id || lp?.id || 'n8n-automation-training';
      const title = lp?.title || '4-Week n8n Automation Training';
      const amount = enrollment.amount_paid || 8000;

      return NextResponse.json({
        verified: true,
        orderId: enrollment.id,
        eventId: `purchase_ref_${reference}`,
        total: amount,
        currency: 'NGN',
        numItems: 1,
        contentIds: [contentId],
        contents: [
          {
            id: contentId,
            title,
            item_price: amount,
            quantity: 1,
          },
        ],
      });
    }

    // If order found but not paid yet
    if (order) {
      return NextResponse.json({
        verified: false,
        status: order.status,
        message: 'Order payment is still processing or not paid',
      });
    }

    // Neither paid order nor active enrollment found
    return NextResponse.json({
      verified: false,
      status: 'NOT_FOUND',
      message: 'Transaction has not been verified',
    });
  } catch (error: any) {
    console.error('Error verifying order status for checkout:', error);
    return NextResponse.json(
      { verified: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
