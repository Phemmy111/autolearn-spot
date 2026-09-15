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

    // Get all paid orders
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('status', 'PAID');

    if (ordersError) {
      return NextResponse.json({ error: ordersError.message }, { status: 500 });
    }

    let processedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    // Process each order
    for (const order of orders || []) {
      try {
        // Get order items
        const { data: items, error: itemsError } = await supabaseAdmin
          .from('order_items')
          .select('*')
          .eq('order_id', order.id);

        if (itemsError) {
          errors.push(`Order ${order.id}: Failed to get items - ${itemsError.message}`);
          continue;
        }

        // Process each item
        for (const item of items || []) {
          try {
            // Check if sale already exists
            const { data: existingSale } = await supabaseAdmin
              .from('author_sales')
              .select('id')
              .eq('order_item_id', item.id)
              .single();

            if (existingSale) {
              skippedCount++;
              continue;
            }

            // Direct insert into author_sales
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

            if (saleError) {
              errors.push(`Order ${order.id}, Item ${item.id}: Sale insert failed - ${saleError.message}`);
              continue;
            }

            // Direct insert into author_transactions
            const { error: transactionError } = await supabaseAdmin
              .from('author_transactions')
              .insert({
                author_id: authorId,
                type: 'SALE_CREDIT',
                amount: item.price_snapshot * 0.9,
                currency: 'NGN',
                related_id: sale.id,
                description: `Sale for order ${order.id}, item ${item.id}`
              });

            if (transactionError) {
              errors.push(`Order ${order.id}, Item ${item.id}: Transaction insert failed - ${transactionError.message}`);
            } else {
              processedCount++;
            }
          } catch (itemError) {
            errors.push(`Order ${order.id}, Item ${item.id}: Processing failed - ${(itemError as Error).message}`);
          }
        }
      } catch (orderError) {
        errors.push(`Order ${order.id}: Processing failed - ${(orderError as Error).message}`);
      }
    }

    // Check final earnings
    const { data: finalEarnings } = await supabaseAdmin
      .from('author_earnings')
      .select('*')
      .eq('author_id', authorId)
      .single();

    return NextResponse.json({
      success: true,
      processed: processedCount,
      skipped: skippedCount,
      errors: errors.slice(0, 10),
      finalEarnings: finalEarnings || null,
      message: `Processed ${processedCount} sales, skipped ${skippedCount}`
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
