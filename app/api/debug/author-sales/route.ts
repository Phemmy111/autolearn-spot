import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check if products have author_id
    const { data: products, error: productsError } = await supabaseAdmin
      .from('learning_products')
      .select('id, title, author_id')
      .limit(5);

    // Check if there are any author_sales records
    const { data: authorSales, error: salesError } = await supabaseAdmin
      .from('author_sales')
      .select('*')
      .limit(5);

    // Check if there are any paid orders
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('id, status, provider_ref')
      .eq('status', 'PAID')
      .limit(5);

    // Check order_items
    const { data: orderItems, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .select('id, order_id, learning_product_id, price_snapshot')
      .limit(5);

    return NextResponse.json({
      success: true,
      products: products || [],
      authorSales: authorSales || [],
      orders: orders || [],
      orderItems: orderItems || [],
      errors: {
        products: productsError?.message,
        sales: salesError?.message,
        orders: ordersError?.message,
        items: itemsError?.message
      }
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
