/**
 * POST /api/cart/checkout
 *
 * Converts the current cart to a PENDING order and initialises a Paystack
 * transaction. Returns the Paystack authorization_url, reference, and orderId.
 *
 * Security guarantees:
 * - All pricing is read server-side from learning_products.price.
 * - Amount sent to Paystack = order.total (in kobo).
 * - order_ref is a server-generated UUID.
 * - Cart is NOT cleared until the webhook confirms PAID.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getCartDetails } from '@/lib/cart-service';
import { createOrderFromCart, setOrderProviderRef } from '@/lib/order-service';

const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY!;

export async function POST(request: NextRequest) {
  // 1. Authenticate
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Get Clerk user for email/name
  const clerkUser = await currentUser();
  const email =
    clerkUser?.emailAddresses?.[0]?.emailAddress ??
    clerkUser?.primaryEmailAddress?.emailAddress;
  const fullName =
    clerkUser?.fullName ??
    `${clerkUser?.firstName ?? ''} ${clerkUser?.lastName ?? ''}`.trim() ??
    'Student';

  if (!email) {
    return NextResponse.json({ error: 'User email not found' }, { status: 400 });
  }

  // 3. Fetch cart
  const cart = await getCartDetails(userId);
  if (!cart || cart.item_count === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 422 });
  }

  // 4. Create PENDING order + order_items snapshot
  const order = await createOrderFromCart(userId, cart);
  if (!order) {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }

  // 5. Parse optional callback URL from body
  let callbackUrl: string | undefined;
  try {
    const body = await request.json().catch(() => ({}));
    callbackUrl = body?.callbackUrl;
  } catch {
    // ignore
  }

  // 6. Initialise Paystack transaction
  if (!paystackSecretKey) {
    return NextResponse.json({ error: 'Payment provider not configured' }, { status: 500 });
  }

  const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${paystackSecretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      // Paystack requires amount in kobo (smallest currency unit)
      amount: Math.round(order.total * 100),
      currency: order.currency,
      metadata: {
        payment_type: 'cart_checkout',
        order_id: order.id,
        order_ref: order.order_ref,
        full_name: fullName,
        user_id: userId,
      },
      callback_url:
        callbackUrl ??
        `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://autolearn-spot.vercel.app'}/checkout/success`,
      channels: ['card', 'bank', 'ussd', 'qr'],
    }),
  });

  const paystackData = await paystackResponse.json();

  if (!paystackData.status) {
    console.error('cart/checkout: Paystack initialization failed', paystackData);
    // Mark order as FAILED so it does not sit PENDING forever
    await import('@/lib/supabase').then(({ supabaseAdmin }) =>
      supabaseAdmin
        .from('orders')
        .update({ status: 'FAILED', updated_at: new Date().toISOString() })
        .eq('id', order.id)
    );
    return NextResponse.json(
      { error: 'Failed to initialize payment', details: paystackData.message },
      { status: 500 }
    );
  }

  // 7. Persist the Paystack reference on the order
  const providerRef: string = paystackData.data.reference;
  await setOrderProviderRef(order.id, providerRef);

  return NextResponse.json({
    authorization_url: paystackData.data.authorization_url,
    reference: providerRef,
    access_code: paystackData.data.access_code,
    orderId: order.id,
    orderRef: order.order_ref,
    total: order.total,
    currency: order.currency,
    itemCount: cart.item_count,
  });
}
