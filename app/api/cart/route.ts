/**
 * GET /api/cart  - Retrieve the student's cart.
 * POST /api/cart - Add a product to the cart.
 *                  Body: { learningProductId: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
import { getCartDetails, addProductToCart } from '@/lib/cart-service';

export const dynamic = 'force-dynamic';

async function getIdentifier() {
  const { userId } = await auth();
  if (userId) return userId;

  const cookieStore = await cookies();
  let guestId = cookieStore.get('guest_cart_id')?.value;
  if (!guestId) {
    guestId = 'guest_' + crypto.randomUUID();
  }
  return guestId;
}

// GET
export async function GET() {
  const identifier = await getIdentifier();
  const cart = await getCartDetails(identifier);
  if (!cart) {
    return NextResponse.json({ error: 'Failed to retrieve cart' }, { status: 500 });
  }

  const response = NextResponse.json({ cart });
  if (identifier.startsWith('guest_')) {
    response.cookies.set('guest_cart_id', identifier, { maxAge: 60 * 60 * 24 * 30, httpOnly: true, secure: true });
  }
  return response;
}

// POST
export async function POST(request: NextRequest) {
  const identifier = await getIdentifier();

  let body: { learningProductId?: string };
  try {
    body = await request.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { learningProductId } = body;
  if (!learningProductId) {
    return NextResponse.json({ error: 'learningProductId is required' }, { status: 400 });
  }

  const result = await addProductToCart(identifier, learningProductId);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const cart = await getCartDetails(identifier);
  const response = NextResponse.json({ cart }, { status: 201 });
  if (identifier.startsWith('guest_')) {
    response.cookies.set('guest_cart_id', identifier, { maxAge: 60 * 60 * 24 * 30, httpOnly: true, secure: true });
  }
  return response;
}
