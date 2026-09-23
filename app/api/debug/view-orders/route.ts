/**
 * GET /api/debug/view-orders
 * Debug endpoint to view orders with customer details
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Fetch all paid orders with customer details
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('id, user_id, status, customer_name, customer_email, created_at, order_ref')
      .eq('status', 'PAID')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch order items to see which products
    const orderIds = orders?.map(o => o.id) || [];
    const { data: orderItems } = await supabaseAdmin
      .from('order_items')
      .select('order_id, learning_product_id, product_title')
      .in('order_id', orderIds);

    // Map order items to orders
    const ordersWithItems = orders?.map(order => {
      const items = orderItems?.filter(oi => oi.order_id === order.id) || [];
      return {
        ...order,
        items: items,
      };
    });

    return NextResponse.json({
      success: true,
      totalOrders: orders?.length || 0,
      orders: ordersWithItems,
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
