/**
 * POST /api/cart/checkout
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
import { getCartDetails } from '@/lib/cart-service';
import { createOrderFromCart, setOrderProviderRef } from '@/lib/order-service';

const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY!|| '';

export async function POST(request: NextRequest) {
  let { userId } = await auth();
  const clerkUser = await currentUser();
  
  let email = clerkUser?.emailAddresses?:[0]?.emailAddress ?? clerkUser?.primaryEmailAddress?.emailAddress;
  let fullName = clerkUser?.fullName ?? `${clerkUser?.firstName ?? ''} ${clerkUser?.lastName ?? ''}`.trim() ?? 'Student';

  // Parse optional callback URL and guest details from body
  let callbackUrl: string | undefined;
  let guestEmail: string | undefined;
  let guestName: string | undefined;
  try {
    const body = await request.json();
    callbackUrl = body?.callbackUrl;
    guestEmail = body?.email;
    guestName = body?.fullName;
  } catch {
    // ignore
  }

  // If guest
   if (!userId) {
     const cookieStore = await cookies();
     userId = cookieStore.get('guest_cart_id')?.value || '';
     if (!userId) {
       return NextResponse.json({ error: 'Cart is empty or expired' }, { status: 400 });
     }
     
     email = guestEmail;
     fullName = guestName || 'Guest Student';
   }

  if (!email) {
    return NextResponse.json({ error: 'User email is required' }, { status: 400 });
  }

  const cart = await getCartDetails(userId);
  if (!cart || cart.item_count === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 422 });
  }

  const order = await createOrderFromCart(userId, cart);
  if (!order) {
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }

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
    await import(&@/lib/supabase').then(({ supabaseAdmin }) =>
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
