/**
 * POST /api/debug/backfill-order-customer-details
 * 
 * Safe backfill script to populate customer_name and customer_email for existing orders
 * from Paystack API without triggering webhooks or creating duplicates.
 * 
 * This script:
 * 1. Fetches paid orders that don't have customer details
 * 2. Calls Paystack API to get transaction details
 * 3. Updates only customer_name and customer_email fields
 * 4. Does NOT change order status or trigger any webhook logic
 * 5. No risk of duplicate enrollments, transactions, or emails
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY!;

async function runBackfill() {
  try {
    console.log('[BACKFILL] Starting order customer details backfill');

    // Fetch paid orders that don't have customer details
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('id, provider_ref, status')
      .eq('status', 'PAID')
      .is('customer_name', null);

    if (ordersError) {
      console.error('[BACKFILL] Error fetching orders:', ordersError);
      return { error: 'Failed to fetch orders' };
    }

    if (!orders || orders.length === 0) {
      console.log('[BACKFILL] No orders to backfill');
      return { 
        success: true, 
        message: 'No orders to backfill',
        updated: 0 
      };
    }

    console.log(`[BACKFILL] Found ${orders.length} orders to backfill`);

    let updatedCount = 0;
    const errors: string[] = [];

    for (const order of orders) {
      if (!order.provider_ref) {
        console.log(`[BACKFILL] Order ${order.id} has no provider_ref, skipping`);
        errors.push(`Order ${order.id}: No provider_ref`);
        continue;
      }

      try {
        // Fetch transaction details from Paystack
        const paystackResponse = await fetch(
          `https://api.paystack.co/transaction/verify/${order.provider_ref}`,
          {
            headers: {
              Authorization: `Bearer ${paystackSecretKey}`,
            },
          }
        );

        const paystackData = await paystackResponse.json();

        if (!paystackData.status) {
          console.error(`[BACKFILL] Paystack API failed for order ${order.id}:`, paystackData.message);
          errors.push(`Order ${order.id}: Paystack API failed - ${paystackData.message}`);
          continue;
        }

        const transaction = paystackData.data;
        const customer = transaction.customer;
        const firstName = customer.first_name;
        const lastName = customer.last_name;
        const fullName = [firstName, lastName].filter(Boolean).join(' ');
        const email = customer.email;

        if (!fullName && !email) {
          console.log(`[BACKFILL] No customer data in Paystack for order ${order.id}`);
          errors.push(`Order ${order.id}: No customer data in Paystack`);
          continue;
        }

        // Update only customer_name and customer_email fields
        const { error: updateError } = await supabaseAdmin
          .from('orders')
          .update({
            customer_name: fullName || null,
            customer_email: email || null,
          })
          .eq('id', order.id);

        if (updateError) {
          console.error(`[BACKFILL] Failed to update order ${order.id}:`, updateError);
          errors.push(`Order ${order.id}: Update failed - ${updateError.message}`);
          continue;
        }

        console.log(`[BACKFILL] Successfully updated order ${order.id}:`, {
          customer_name: fullName,
          customer_email: email,
        });
        updatedCount++;

      } catch (error) {
        console.error(`[BACKFILL] Error processing order ${order.id}:`, error);
        errors.push(`Order ${order.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`[BACKFILL] Completed. Updated ${updatedCount}/${orders.length} orders`);

    return {
      success: true,
      message: `Backfill completed. Updated ${updatedCount}/${orders.length} orders.`,
      updated: updatedCount,
      total: orders.length,
      errors: errors.length > 0 ? errors : undefined,
    };

  } catch (error) {
    console.error('[BACKFILL] Unexpected error:', error);
    return { 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function GET(request: NextRequest) {
  const result = await runBackfill();
  
  if (result.error) {
    return NextResponse.json(result, { status: 500 });
  }
  
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const result = await runBackfill();
  
  if (result.error) {
    return NextResponse.json(result, { status: 500 });
  }
  
  return NextResponse.json(result);
}
