/**
 * GET /api/cart  – Retrieve the authenticated student's cart.
 * POST /api/cart – Add a product to the cart.
 *                  Body: { learningProductId: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getCartDetails, addProductToCart } from '@/lib/cart-service';

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cart = await getCartDetails(userId);
  if (!cart) {
    return NextResponse.json({ error: 'Failed to retrieve cart' }, { status: 500 });
  }

  return NextResponse.json({ cart });
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { learningProductId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { learningProductId } = body;
  if (!learningProductId) {
    return NextResponse.json({ error: 'learningProductId is required' }, { status: 400 });
  }

  const result = await addProductToCart(userId, learningProductId);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  // Return updated cart
  const cart = await getCartDetails(userId);
  return NextResponse.json({ cart }, { status: 201 });
}
