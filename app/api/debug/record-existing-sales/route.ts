import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
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

    // Get all paid orders for this author's products
    const { data: authorOrders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('id, provider_ref')
      .eq('status', 'PAID');

    if (ordersError) {
      return NextResponse.json({ error: ordersError.message }, { status: 500 });
    }

    let processedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    // Process each order
    for (const order of authorOrders || []) {
      try {
        // Get order items
        const { data: items, error: itemsError } = await supabaseAdmin
          .from('order_items')
          .select('id')
          .eq('order_id', order.id);

        if (itemsError) {
          errors.push(`Order ${order.id}: Failed to get items - ${itemsError.message}`);
          failedCount++;
          continue;
        }

        // Record author sale for each item
        for (const item of items || []) {
          try {
            await supabaseAdmin.rpc('record_author_sale', {
              p_order_id: order.id,
              p_order_item_id: item.id,
            });
            processedCount++;
          } catch (rpcError) {
            errors.push(`Order ${order.id}, Item ${item.id}: RPC failed - ${(rpcError as Error).message}`);
            failedCount++;
          }
        }
      } catch (error) {
        errors.push(`Order ${order.id}: Processing failed - ${(error as Error).message}`);
        failedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedCount,
      failed: failedCount,
      errors: errors.slice(0, 10), // Limit errors to avoid huge response
      message: `Processed ${processedCount} sales, ${failedCount} failed`
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
