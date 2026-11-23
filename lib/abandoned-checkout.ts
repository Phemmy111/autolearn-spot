/**
 * lib/abandoned-checkout.ts
 *
 * Automated recovery and follow-up engine for students who attempted
 * checkout but didn't complete payment on AutoLearn Spot.
 */

import { supabaseAdmin } from '@/lib/supabase';
import { EmailService } from '@/lib/email-service';
import { getOrderItems } from '@/lib/order-service';

export interface FollowupResult {
  success: boolean;
  orderId: string;
  customerEmail?: string;
  alreadySent?: boolean;
  alreadyPaid?: boolean;
  alreadyEnrolled?: boolean;
  error?: string;
  message?: string;
}

/**
 * Check if a follow-up email has already been sent for an order
 */
export async function isFollowupAlreadySent(orderId: string): Promise<boolean> {
  try {
    const { data } = await supabaseAdmin
      .from('notifications')
      .select('id')
      .eq('event_id', `order_followup_${orderId}`)
      .maybeSingle();

    return !!data;
  } catch {
    return false;
  }
}

/**
 * Send a personalized abandoned checkout follow-up email for a specific order
 */
export async function sendFollowupForOrder(
  orderId: string,
  options?: { force?: boolean }
): Promise<FollowupResult> {
  try {
    // 1. Fetch order details
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (orderErr || !order) {
      return { success: false, orderId, error: 'Order not found' };
    }

    // 2. Skip if order is already PAID
    if (order.status === 'PAID') {
      return {
        success: false,
        orderId,
        alreadyPaid: true,
        error: 'Order has already been paid and fulfilled.',
      };
    }

    if (!order.customer_email) {
      return {
        success: false,
        orderId,
        error: 'Order does not have a customer email address.',
      };
    }

    const email = order.customer_email.trim();
    const customerName = order.customer_name || 'Student';

    // 3. Check if follow-up was already sent (unless force is true)
    if (!options?.force) {
      const alreadySent = await isFollowupAlreadySent(order.id);
      if (alreadySent) {
        return {
          success: false,
          orderId,
          customerEmail: email,
          alreadySent: true,
          error: 'Follow-up email has already been sent for this order.',
        };
      }
    }

    // 4. Fetch order items
    const orderItems = await getOrderItems(order.id);
    const firstItem = orderItems?.[0];
    const courseTitle = firstItem?.product_title || 'Your Selected Course';
    const productId = firstItem?.learning_product_id;

    // 5. Check if student already has active enrollment in this product
    if (productId) {
      const { data: existingEnrollment } = await supabaseAdmin
        .from('enrollments')
        .select('id')
        .ilike('email', email)
        .eq('learning_product_id', productId)
        .maybeSingle();

      if (existingEnrollment) {
        return {
          success: false,
          orderId,
          customerEmail: email,
          alreadyEnrolled: true,
          error: 'Student is already enrolled in this course.',
        };
      }
    }

    // 6. Build high-converting checkout link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.autolearnspot.com';
    let checkoutUrl = `${baseUrl}/cart`;
    if (productId) {
      // Direct link to the product or cart
      checkoutUrl = `${baseUrl}/learning_products/${productId}`;
    }

    // 7. Dispatch follow-up email
    const emailSent = await EmailService.sendAbandonedCheckoutFollowup({
      studentEmail: email,
      studentName: customerName,
      courseTitle,
      amount: order.total,
      checkoutUrl,
    });

    if (!emailSent) {
      return {
        success: false,
        orderId,
        customerEmail: email,
        error: 'Email delivery failed (check SMTP configuration).',
      };
    }

    // 8. Record notification log to prevent duplicate emails
    await supabaseAdmin.from('notifications').insert({
      title: 'Abandoned Checkout Follow-up',
      message: `Follow-up email dispatched to ${email} for order ${order.order_ref || order.id}`,
      category: 'system',
      priority: 'normal',
      target_type: 'order',
      target_id: order.id,
      event_id: `order_followup_${order.id}`,
      action_url: `/admin/orders`,
      action_label: 'View Order',
      is_read: false,
    });

    return {
      success: true,
      orderId,
      customerEmail: email,
      message: `Follow-up email successfully sent to ${email}`,
    };
  } catch (err: any) {
    console.error(`[AbandonedCheckout] Error sending follow-up for order ${orderId}:`, err);
    return { success: false, orderId, error: err.message || 'Internal error' };
  }
}

/**
 * Scan and process abandoned pending orders between minAgeHours and maxAgeHours
 */
export async function processAbandonedOrders(params?: {
  minAgeHours?: number;
  maxAgeHours?: number;
  limit?: number;
}) {
  const minAgeHours = params?.minAgeHours ?? 1; // At least 1 hour old so they have time to finish
  const maxAgeHours = params?.maxAgeHours ?? 72; // Up to 3 days old
  const limit = params?.limit ?? 25;

  const now = new Date();
  const minDate = new Date(now.getTime() - maxAgeHours * 60 * 60 * 1000).toISOString();
  const maxDate = new Date(now.getTime() - minAgeHours * 60 * 60 * 1000).toISOString();

  // Query pending orders within the timeframe
  const { data: pendingOrders, error } = await supabaseAdmin
    .from('orders')
    .select('id, order_ref, customer_name, customer_email, total, created_at')
    .eq('status', 'PENDING')
    .gte('created_at', minDate)
    .lte('created_at', maxDate)
    .not('customer_email', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !pendingOrders || pendingOrders.length === 0) {
    return {
      success: true,
      scanned: 0,
      sent: 0,
      skipped: 0,
      message: 'No eligible abandoned orders found in timeframe',
    };
  }

  let sentCount = 0;
  let skippedCount = 0;
  const results: FollowupResult[] = [];

  for (const order of pendingOrders) {
    // Check if already sent
    const alreadySent = await isFollowupAlreadySent(order.id);
    if (alreadySent) {
      skippedCount++;
      continue;
    }

    const res = await sendFollowupForOrder(order.id);
    results.push(res);
    if (res.success) {
      sentCount++;
    } else {
      skippedCount++;
    }
  }

  return {
    success: true,
    scanned: pendingOrders.length,
    sent: sentCount,
    skipped: skippedCount,
    results,
  };
}
