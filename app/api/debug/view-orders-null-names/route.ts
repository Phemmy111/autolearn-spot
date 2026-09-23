/**
 * GET /api/debug/view-orders-null-names
 * Debug endpoint to view orders with null customer names
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Fetch paid orders with null customer names
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('id, user_id, status, customer_name, customer_email, created_at, order_ref')
      .eq('status', 'PAID')
      .is('customer_name', null);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      totalOrders: orders?.length || 0,
      orders: orders,
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
