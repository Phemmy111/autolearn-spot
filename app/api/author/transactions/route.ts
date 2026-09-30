import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
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

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const type = searchParams.get('type');

    // Build query
    let query = supabaseAdmin
      .from('author_transactions')
      .select('*')
      .eq('author_id', author.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by type if specified
    if (type) {
      query = query.eq('type', type);
    }

    const { data: transactions, error } = await query;

    if (error) {
      console.error('Error fetching transactions:', error);
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }

    // Get total count for pagination
    const { count, error: countError } = await supabaseAdmin
      .from('author_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', author.id);

    if (countError) {
      console.error('Error counting transactions:', countError);
    }

    // -------------------------------------------------------
    // Enrich SALE_CREDIT transactions with breakdown details
    // -------------------------------------------------------
    const enriched = await Promise.all(
      (transactions || []).map(async (tx: any) => {
        if (tx.type !== 'SALE_CREDIT' || !tx.related_id) return tx;

        try {
          // Fetch the author_sale record which has the breakdown
          const { data: sale } = await supabaseAdmin
            .from('author_sales')
            .select('id, order_id, item_id, sale_price, commission_amount, net_amount')
            .eq('id', tx.related_id)
            .maybeSingle();

          if (!sale) return tx;

          // Get the order item to find product and student
          const { data: orderItem } = await supabaseAdmin
            .from('order_items')
            .select('id, product_id, price_snapshot')
            .eq('id', sale.item_id)
            .maybeSingle();

          // Get the order to find the student email
          const { data: order } = await supabaseAdmin
            .from('orders')
            .select('id, email, metadata')
            .eq('id', sale.order_id)
            .maybeSingle();

          // Get the product title
          let courseTitle: string | null = null;
          if (orderItem?.product_id) {
            const { data: product } = await supabaseAdmin
              .from('learning_products')
              .select('title')
              .eq('id', orderItem.product_id)
              .maybeSingle();
            courseTitle = product?.title || null;
          }

          // Check for affiliate commission on this order/item
          let affiliateCommission: number | null = null;
          let affiliateName: string | null = null;
          if (sale.order_id) {
            const { data: commission } = await supabaseAdmin
              .from('commissions')
              .select('amount, referrer_id, referrer_type')
              .eq('payment_reference', order?.id)
              .maybeSingle();

            if (commission) {
              affiliateCommission = commission.amount;
              // Try to get partner name
              const { data: partner } = await supabaseAdmin
                .from('partners')
                .select('full_name')
                .eq('id', commission.referrer_id)
                .maybeSingle();
              affiliateName = partner?.full_name || 'Affiliate';
            }
          }

          // Platform commission = sale_price - net_amount - affiliate_commission
          const salePrice = sale.sale_price || orderItem?.price_snapshot || 0;
          const netAmount = sale.net_amount || tx.amount;
          const platformCommission = salePrice - netAmount - (affiliateCommission || 0);

          return {
            ...tx,
            course_title: courseTitle,
            student_email: order?.email || null,
            sale_price: salePrice,
            platform_commission: platformCommission > 0 ? platformCommission : null,
            affiliate_commission: affiliateCommission,
            affiliate_name: affiliateName,
            net_amount: netAmount,
          };
        } catch (e) {
          // If enrichment fails, return raw transaction without crashing
          console.error('[transactions] Enrichment failed for tx', tx.id, e);
          return tx;
        }
      })
    );

    return NextResponse.json({
      success: true,
      transactions: enriched,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error in transactions API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
