import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: productId } = await params;
  const body = await request.json();
  const { affiliate_enabled, affiliate_commission_rate } = body;

  // Validate rate
  if (affiliate_commission_rate !== undefined) {
    const rate = Number(affiliate_commission_rate);
    if (isNaN(rate) || rate < 5 || rate > 70) {
      return NextResponse.json({ error: 'Commission rate must be between 5% and 70%' }, { status: 400 });
    }
  }

  // Verify product belongs to this author
  const { data: author } = await supabaseAdmin
    .from('authors')
    .select('id')
    .eq('clerk_user_id', userId)
    .single();

  if (!author) return NextResponse.json({ error: 'Author not found' }, { status: 404 });

  const { data: product } = await supabaseAdmin
    .from('learning_products')
    .select('id, author_id')
    .eq('id', productId)
    .single();

  if (!product || product.author_id !== author.id) {
    return NextResponse.json({ error: 'Product not found or access denied' }, { status: 403 });
  }

  const updates: Record<string, any> = {};
  if (affiliate_enabled !== undefined) updates.affiliate_enabled = affiliate_enabled;
  if (affiliate_commission_rate !== undefined) updates.affiliate_commission_rate = Number(affiliate_commission_rate);

  const { data: updated, error } = await supabaseAdmin
    .from('learning_products')
    .update(updates)
    .eq('id', productId)
    .select('id, affiliate_enabled, affiliate_commission_rate, price')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, ...updated });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: productId } = await params;

  const { data: author } = await supabaseAdmin
    .from('authors')
    .select('id')
    .eq('clerk_user_id', userId)
    .single();

  if (!author) return NextResponse.json({ error: 'Author not found' }, { status: 404 });

  const { data: product } = await supabaseAdmin
    .from('learning_products')
    .select('id, title, price, affiliate_enabled, affiliate_commission_rate, author_id')
    .eq('id', productId)
    .single();

  if (!product || product.author_id !== author.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(product);
}
