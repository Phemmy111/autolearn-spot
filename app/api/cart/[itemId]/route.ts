/**
 * DELETE /api/cart/[itemId] – Remove a specific item from the authenticated student's cart.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
import { removeCartItem } from '@/lib/cart-service';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  let { userId } = await auth();
  if (!userId) {
    const cookieStore = await cookies();
    userId = cookieStore.get('guest_cart_id')?.value || null;
  }

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { itemId } = await params;
  if (!itemId) {
    return NextResponse.json({ error: 'itemId is required' }, { status: 400 });
  }

  const result = await removeCartItem(userId, itemId);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ message: 'Item removed from cart' });
}
