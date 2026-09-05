import { requireAuthor } from '@/lib/author';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

/**
 * Helper that ensures the authenticated user is an approved/active author
 * and that the requested product belongs to them.
 * Returns the userId if checks pass, otherwise throws a NextResponse error.
 */
export async function requireAuthorProduct(productId: string): Promise<string> {
  const result = await requireAuthor();
  const userId = "userId" in result ? result.userId : (() => { throw result; })();
  const { data, error } = await supabaseAdmin
    .from('learning_products')
    .select('author_id, status')
    .eq('id', productId)
    .single();

  if (error || !data) {
    console.error('[requireAuthorProduct] product not found or DB error:', error);
    throw NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  const product = data as { author_id: string; status: string };

  if (product.author_id !== userId) {
    throw NextResponse.json({ error: 'Forbidden: not your product' }, { status: 403 });
  }

  return userId;
}
