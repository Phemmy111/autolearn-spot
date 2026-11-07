/**
 * lib/order-fulfillment.ts
 *
 * Centralized, idempotent order fulfillment engine for AutoLearn Spot.
 * Used by:
 * 1. Paystack Webhooks (/api/webhooks/paystack and /api/webhook/paystack)
 * 2. Client-side Verification Fallback (/api/checkout/order-status)
 * 3. Manual Resync / Admin Fixes
 */

import { supabaseAdmin } from '@/lib/supabase';
import { getOrderByProviderRef, getOrderItems, Order, OrderItem } from '@/lib/order-service';
import { clearCartItems } from '@/lib/cart-service';
import { dispatchCapiWithOutbox } from '@/lib/meta-capi-outbox';
import { EmailService } from '@/lib/email-service';
import { PartnerEmailService } from '@/lib/growth-engine/PartnerEmailService';
import { NotificationService as PartnerNotificationService } from '@/lib/growth-engine/NotificationService';
import { logUserActivity } from '@/lib/audit-logging';

export interface FulfillOrderParams {
  orderId?: string;
  reference?: string;
  customerEmail?: string;
  customerName?: string;
  amountInNaira?: number;
  ipAddress?: string;
  affiliateRef?: string;
}

export interface FulfillmentResult {
  success: boolean;
  order?: Order;
  alreadyPaid?: boolean;
  error?: string;
}

export async function fulfillCartOrder(params: FulfillOrderParams): Promise<FulfillmentResult> {
  const { orderId, reference, customerEmail, customerName, amountInNaira, ipAddress, affiliateRef } = params;

  // 1. Locate the order
  let order: Order | null = null;
  if (orderId) {
    const { data } = await supabaseAdmin.from('orders').select('*').eq('id', orderId).maybeSingle();
    order = (data as Order) || null;
  }

  if (!order && reference) {
    order = await getOrderByProviderRef(reference);
  }

  if (!order && reference) {
    const { data } = await supabaseAdmin.from('orders').select('*').eq('order_ref', reference).maybeSingle();
    order = (data as Order) || null;
  }

  if (!order) {
    console.error(`[Fulfillment] Order not found for orderId: ${orderId}, reference: ${reference}`);
    return { success: false, error: 'Order not found' };
  }

  const orderItems = await getOrderItems(order.id);
  if (!orderItems || orderItems.length === 0) {
    console.error(`[Fulfillment] No items found for order ${order.id}`);
    return { success: false, error: 'Order has no items' };
  }

  const email = customerEmail || order.customer_email || '';
  const confirmedFullName = customerName || order.customer_name || 'Student';
  const nameParts = confirmedFullName.split(' ');
  const firstName = nameParts[0] || 'Student';
  const lastName = nameParts.slice(1).join(' ') || '';

  // 2. Idempotency check: if already PAID, ensure enrollments exist and deliver CAPI
  if (order.status === 'PAID') {
    console.log(`[Fulfillment] Order ${order.id} is already marked PAID. Verifying enrollments.`);
    await ensureEnrollmentsAndCapi(order, orderItems, email, confirmedFullName, firstName, lastName, reference, ipAddress);
    return { success: true, order, alreadyPaid: true };
  }

  // 3. Amount verification (if supplied)
  if (amountInNaira !== undefined && amountInNaira !== order.total) {
    console.error(`[Fulfillment] Amount mismatch for order ${order.id}. Expected ${order.total}, got ${amountInNaira}`);
    return { success: false, error: 'Payment amount mismatch' };
  }

  // 4. Update customer details & mark order PAID
  await supabaseAdmin
    .from('orders')
    .update({
      customer_name: confirmedFullName,
      customer_email: email,
      provider_ref: reference || order.provider_ref,
      status: 'PAID',
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', order.id);

  order.status = 'PAID';
  order.customer_name = confirmedFullName;
  order.customer_email = email;

  // 5. Record Author Sales & Transactions
  await recordAuthorSales(order, orderItems, affiliateRef);

  // 6. Create Enrollments for each item
  await createOrUpdateEnrollments(order, orderItems, email, confirmedFullName, firstName, lastName, reference);

  // 7. Affiliate Commission Payout (if purchased via affiliate link)
  if (affiliateRef) {
    await processAffiliateCommission(orderItems, affiliateRef, email, reference || order.provider_ref || '');
  }

  // 8. Clear user cart
  if (order.user_id) {
    await clearCartItems(order.user_id).catch(() => {});
  }

  // 9. Meta Conversions API (CAPI) Outbox
  try {
    await dispatchCapiWithOutbox({
      event_name: 'Purchase',
      event_id: `purchase_${order.id}`,
      event_source_url: 'https://www.autolearnspot.com/checkout/success',
      action_source: 'website',
      user_data: {
        email: email || null,
        firstName: firstName || null,
        lastName: lastName || null,
        clientIpAddress: ipAddress || null,
      },
      custom_data: {
        currency: order.currency || 'NGN',
        value: order.total,
        content_type: 'product',
        content_ids: orderItems.map((i: any) => i.learning_product_id),
        contents: orderItems.map((i: any) => ({
          id: i.learning_product_id,
          title: i.product_title,
          item_price: i.price_snapshot,
          quantity: 1,
        })),
        num_items: orderItems.length,
        order_id: order.id,
      },
    });
  } catch (capiError) {
    console.warn('[Fulfillment] Meta CAPI dispatch error (non-fatal):', capiError);
  }

  // 10. Send Automated Emails (wrapped safely so SMTP errors never fail fulfillment)
  await sendFulfillmentEmails(order, orderItems, email, confirmedFullName, affiliateRef);

  // 11. Audit logging
  await logUserActivity({
    action: 'cart_checkout_completed',
    user_id: email || order.user_id,
    user_email: email,
    description: `Order ${order.id} fulfilled for ₦${order.total} (${orderItems.length} items)`,
    metadata: {
      orderId: order.id,
      paymentReference: reference || order.provider_ref,
    },
  }).catch(() => {});

  console.log(`[Fulfillment] Order ${order.id} completely fulfilled.`);
  return { success: true, order, alreadyPaid: false };
}

/**
 * Record author sales and credit author transactions
 */
async function recordAuthorSales(order: Order, orderItems: OrderItem[], affiliateRef?: string) {
  let commissionRate = 10; // Default 10%
  try {
    const { data: commissionSetting } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', 'platform_commission_rate')
      .single();

    if (commissionSetting?.value) {
      const parsed = typeof commissionSetting.value === 'string'
        ? JSON.parse(commissionSetting.value)
        : commissionSetting.value;
      if (typeof parsed === 'number') commissionRate = parsed;
      else if (parsed?.rate) commissionRate = parsed.rate;
    }
  } catch {
    // ignore
  }

  const commissionDecimal = commissionRate / 100;

  for (const item of orderItems) {
    try {
      const { data: existingSale } = await supabaseAdmin
        .from('author_sales')
        .select('id')
        .eq('order_item_id', item.id)
        .maybeSingle();

      if (existingSale) continue;

      const { data: product } = await supabaseAdmin
        .from('learning_products')
        .select('author_id, affiliate_commission_rate, affiliate_enabled')
        .eq('id', item.learning_product_id)
        .single();

      if (!product?.author_id) {
        console.error(`[Fulfillment] Product ${item.learning_product_id} has no author_id`);
        continue;
      }

      let affiliateCommissionAmount = 0;
      if (affiliateRef && product.affiliate_enabled !== false) {
        const { data: refCode } = await supabaseAdmin
          .from('referral_codes')
          .select('id')
          .eq('code', affiliateRef)
          .maybeSingle();

        if (refCode) {
          const { data: affLink } = await supabaseAdmin
            .from('affiliate_links')
            .select('id')
            .eq('referral_code_id', refCode.id)
            .eq('learning_product_id', item.learning_product_id)
            .maybeSingle();

          if (affLink) {
            const affRate = (product.affiliate_commission_rate || 20) / 100;
            affiliateCommissionAmount = Math.round(item.price_snapshot * affRate);
          }
        }
      }

      const platformCommissionAmount = Math.round(item.price_snapshot * commissionDecimal);
      const totalCommissionDeduction = platformCommissionAmount + affiliateCommissionAmount;
      const netAmount = Math.max(0, item.price_snapshot - totalCommissionDeduction);

      const { data: sale, error: saleError } = await supabaseAdmin
        .from('author_sales')
        .insert({
          order_id: order.id,
          order_item_id: item.id,
          product_id: item.learning_product_id,
          author_id: product.author_id,
          gross_amount: item.price_snapshot,
          commission_amount: totalCommissionDeduction,
          net_amount: netAmount,
          currency: 'NGN',
        })
        .select()
        .single();

      if (saleError || !sale) {
        console.error(`[Fulfillment] Failed to insert author sale for item ${item.id}:`, saleError);
        continue;
      }

      const txDescription = affiliateCommissionAmount > 0
        ? `Sale for order ${order.id}, item ${item.id} (Affiliate: ${affiliateRef}, -₦${affiliateCommissionAmount} comm.)`
        : `Sale for order ${order.id}, item ${item.id}`;

      await supabaseAdmin.from('author_transactions').insert({
        author_id: product.author_id,
        type: 'SALE_CREDIT',
        amount: netAmount,
        currency: 'NGN',
        related_id: sale.id,
        description: txDescription,
      });

      console.log(`[Fulfillment] Author credited ₦${netAmount} for order ${order.id}`);
    } catch (err) {
      console.error(`[Fulfillment] Error recording author sale for item ${item.id}:`, err);
    }
  }
}

/**
 * Process affiliate commission if student purchased via an affiliate link
 */
async function processAffiliateCommission(
  orderItems: OrderItem[],
  affiliateRef: string,
  email: string,
  reference: string
) {
  try {
    for (const item of orderItems) {
      const { data: refCode } = await supabaseAdmin
        .from('referral_codes')
        .select('id, owner_id, owner_type')
        .eq('code', affiliateRef)
        .maybeSingle();

      if (!refCode) continue;

      const { data: affLink } = await supabaseAdmin
        .from('affiliate_links')
        .select('id, partner_id')
        .eq('referral_code_id', refCode.id)
        .eq('learning_product_id', item.learning_product_id)
        .maybeSingle();

      if (!affLink) continue;

      const { data: affProduct } = await supabaseAdmin
        .from('learning_products')
        .select('affiliate_commission_rate, affiliate_enabled')
        .eq('id', item.learning_product_id)
        .single();

      if (affProduct?.affiliate_enabled === false) continue;

      const affRate = (affProduct?.affiliate_commission_rate || 20) / 100;
      const affiliateAmount = Math.round(item.price_snapshot * affRate);
      if (affiliateAmount <= 0) continue;

      const { data: currentPartner } = await supabaseAdmin
        .from('partners')
        .select('id, email, full_name, user_type, available_earnings, lifetime_earnings')
        .eq('id', affLink.partner_id)
        .maybeSingle();

      const referrerType = currentPartner?.user_type === 'ambassador' ? 'ambassador' : 'partner';

      // Insert commission
      await supabaseAdmin.from('commissions').insert({
        referrer_id: affLink.partner_id,
        referrer_type: referrerType,
        referee_email: email,
        referral_code: affiliateRef,
        payment_reference: reference,
        amount: affiliateAmount,
        status: 'available',
        learning_product_id: item.learning_product_id,
        holding_period_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      // Credit partner earnings
      if (currentPartner) {
        await supabaseAdmin.from('partners').update({
          available_earnings: (currentPartner.available_earnings || 0) + affiliateAmount,
          lifetime_earnings: (currentPartner.lifetime_earnings || 0) + affiliateAmount,
        }).eq('id', affLink.partner_id);
      }

      // Update link stats
      const { data: currentLink } = await supabaseAdmin
        .from('affiliate_links')
        .select('conversions, total_earned')
        .eq('id', affLink.id)
        .single();

      if (currentLink) {
        await supabaseAdmin.from('affiliate_links').update({
          conversions: (currentLink.conversions || 0) + 1,
          total_earned: (currentLink.total_earned || 0) + affiliateAmount,
        }).eq('id', affLink.id);
      }

      // Partner notification
      if (currentPartner?.email) {
        try {
          await PartnerEmailService.sendCommissionEarnedEmail(
            currentPartner.email,
            currentPartner.full_name || 'Partner',
            affiliateAmount,
            email
          );
          await PartnerNotificationService.createNotification({
            partnerId: affLink.partner_id,
            type: 'commission_earned',
            title: 'Commission Earned! 💰',
            message: `You earned ₦${affiliateAmount.toLocaleString()} from a course referral.`,
            metadata: { amount: affiliateAmount, courseId: item.learning_product_id }
          });
        } catch {
          // non-fatal
        }
      }
    }
  } catch (affErr) {
    console.error('[Fulfillment] Affiliate commission processing error:', affErr);
  }
}

/**
 * Create or update enrollments for student
 */
async function createOrUpdateEnrollments(
  order: Order,
  orderItems: OrderItem[],
  email: string,
  confirmedFullName: string,
  firstName: string,
  lastName: string,
  reference?: string
) {
  let activeCohortId: string | null = null;
  try {
    const { data: cohort } = await supabaseAdmin
      .from('cohorts')
      .select('id')
      .eq('is_current', true)
      .maybeSingle();
    activeCohortId = cohort?.id || null;
  } catch {
    // ignore
  }

  const clerkUserIdToUse = (order.user_id && !order.user_id.startsWith('guest_') && !order.user_id.startsWith('manual_'))
    ? order.user_id
    : null;

  for (const item of orderItems) {
    try {
      const { data: existing } = await supabaseAdmin
        .from('enrollments')
        .select('id, clerk_user_id')
        .eq('learning_product_id', item.learning_product_id)
        .ilike('email', email)
        .maybeSingle();

      if (existing) {
        await supabaseAdmin
          .from('enrollments')
          .update({
            clerk_user_id: clerkUserIdToUse || existing.clerk_user_id,
            payment_ref: reference || order.provider_ref,
            amount_paid: item.price_snapshot,
            payment_amount: item.price_snapshot,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        console.log(`[Fulfillment] Updated existing enrollment ${existing.id} for ${email}`);
      } else {
        const { data: newEnr, error: enrErr } = await supabaseAdmin
          .from('enrollments')
          .insert({
            cohort_id: activeCohortId,
            learning_product_id: item.learning_product_id,
            clerk_user_id: clerkUserIdToUse,
            email: email,
            full_name: confirmedFullName,
            first_name: firstName,
            last_name: lastName,
            payment_ref: reference || order.provider_ref,
            amount_paid: item.price_snapshot,
            payment_amount: item.price_snapshot,
            status: 'not_started',
            enrolled_at: new Date().toISOString(),
            activated_at: null,
          })
          .select();

        if (enrErr) {
          console.error(`[Fulfillment] Enrollment insert failed:`, enrErr);
        } else {
          console.log(`[Fulfillment] Created new enrollment for ${email}`);
        }
      }
    } catch (err) {
      console.error(`[Fulfillment] Enrollment handling error for item ${item.id}:`, err);
    }
  }
}

/**
 * Ensure enrollments and CAPI are delivered even if order was already marked PAID
 */
async function ensureEnrollmentsAndCapi(
  order: Order,
  orderItems: OrderItem[],
  email: string,
  confirmedFullName: string,
  firstName: string,
  lastName: string,
  reference?: string,
  ipAddress?: string
) {
  await createOrUpdateEnrollments(order, orderItems, email, confirmedFullName, firstName, lastName, reference);

  try {
    await dispatchCapiWithOutbox({
      event_name: 'Purchase',
      event_id: `purchase_${order.id}`,
      event_source_url: 'https://www.autolearnspot.com/checkout/success',
      action_source: 'website',
      user_data: {
        email: email || null,
        firstName: firstName || null,
        lastName: lastName || null,
        clientIpAddress: ipAddress || null,
      },
      custom_data: {
        currency: order.currency || 'NGN',
        value: order.total,
        content_type: 'product',
        content_ids: orderItems.map((i: any) => i.learning_product_id),
        contents: orderItems.map((i: any) => ({
          id: i.learning_product_id,
          title: i.product_title,
          item_price: i.price_snapshot,
          quantity: 1,
        })),
        num_items: orderItems.length,
        order_id: order.id,
      },
    });
  } catch (e) {
    console.warn('[Fulfillment] CAPI dispatch warning on retry:', e);
  }
}

/**
 * Send automated fulfillment emails safely
 */
async function sendFulfillmentEmails(
  order: Order,
  orderItems: OrderItem[],
  email: string,
  confirmedFullName: string,
  affiliateRef?: string
) {
  for (const item of orderItems) {
    try {
      const { data: product } = await supabaseAdmin
        .from('learning_products')
        .select('*')
        .eq('id', item.learning_product_id)
        .single();

      if (!product) continue;

      let author: any = null;
      if (product.author_id) {
        const { data: authorData } = await supabaseAdmin
          .from('authors')
          .select('display_name, email')
          .eq('id', product.author_id)
          .single();
        author = authorData;
      }

      // 1. Send confirmation to student
      try {
        await EmailService.sendCoursePurchaseConfirmation(
          email,
          confirmedFullName,
          product.title,
          item.price_snapshot,
          order.provider_ref || order.id
        );
        console.log(`[Fulfillment] Purchase confirmation email sent to student ${email}`);
      } catch (studentEmailErr) {
        console.warn(`[Fulfillment] Failed to send student purchase email (non-fatal):`, studentEmailErr);
      }

      // 2. Send notification to author
      if (author?.email) {
        try {
          const authorEarnings = Math.round(item.price_snapshot * 0.9);
          await EmailService.sendCourseSaleNotification(
            author.email,
            author.display_name || 'Author',
            product.title,
            email,
            item.price_snapshot,
            authorEarnings
          );
          console.log(`[Fulfillment] New sale notification sent to author ${author.email}`);
        } catch (authorEmailErr) {
          console.warn(`[Fulfillment] Failed to send author sale email (non-fatal):`, authorEmailErr);
        }
      }

      // 3. Send notification to platform admins / system (autolearnspot@gmail.com)
      try {
        await EmailService.sendCoursePurchaseNotificationToRecipients(
          email,
          confirmedFullName,
          product.title,
          item.price_snapshot,
          order.provider_ref || order.id
        );
        const platformCommission = Math.round(item.price_snapshot * 0.1);
        await EmailService.sendFounderCourseSaleNotification(
          product.title,
          author?.display_name || 'Author',
          email,
          item.price_snapshot,
          platformCommission
        );
        console.log(`[Fulfillment] Admin purchase and sale notifications dispatched`);
      } catch (adminEmailErr) {
        console.warn(`[Fulfillment] Failed to send admin sale notification (non-fatal):`, adminEmailErr);
      }
    } catch (err) {
      console.warn(`[Fulfillment] Email processing error for item ${item.id}:`, err);
    }
  }
}
