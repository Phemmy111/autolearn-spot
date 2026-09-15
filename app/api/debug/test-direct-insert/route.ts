import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get author ID from authenticated user
    const { data: author, error: authorErr } = await supabaseAdmin
      .from('authors')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    if (authorErr || !author) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 });
    }

    const authorId = author.id;

    // Get the latest paid order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('status', 'PAID')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'No paid orders found' }, { status: 404 });
    }

    // Get order items
    const { data: items, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .select('*')
      .eq('order_id', order.id);

    if (itemsError || !items || items.length === 0) {
      return NextResponse.json({ error: 'No order items found' }, { status: 404 });
    }

    const item = items[0];

    // Try direct insert into author_sales
    const { data: sale, error: saleError } = await supabaseAdmin
      .from('author_sales')
      .insert({
        order_id: order.id,
        order_item_id: item.id,
        product_id: item.learning_product_id,
        author_id: authorId,
        gross_amount: item.price_snapshot,
        commission_amount: item.price_snapshot * 0.1, // 10% commission
        net_amount: item.price_snapshot * 0.9, // 90% net
        currency: 'NGN'
      })
      .select()
      .single();

    // Try direct insert into author_transactions
    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from('author_transactions')
      .insert({
        author_id: authorId,
        type: 'SALE_CREDIT',
        amount: item.price_snapshot * 0.9,
        currency: 'NGN',
        related_id: sale?.id,
        description: `Direct test sale for order ${order.id}`
      })
      .select()
      .single();

    // Check if earnings were updated
    const { data: updatedEarnings, error: earningsError } = await supabaseAdmin
      .from('author_earnings')
      .select('*')
      .eq('author_id', authorId)
      .single();

    return NextResponse.json({
      success: true,
      testResults: {
        order: order.id,
        item: item.id,
        sale: sale || null,
        saleError: saleError?.message,
        transaction: transaction || null,
        transactionError: transactionError?.message,
        updatedEarnings: updatedEarnings || null,
        earningsError: earningsError?.message
      }
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
