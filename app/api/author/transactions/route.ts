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

    if (type) {
      query = query.eq('type', type);
    }

    const { data: transactions, error } = await query;

    if (error) {
      console.error('Error fetching transactions:', error);
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }

    // Get total count
    const { count } = await supabaseAdmin
      .from('author_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', author.id);

    // -------------------------------------------------------
    // Enrich SALE_CREDIT transactions with full breakdown
    // author_sales columns: id, order_id, order_item_id, product_id,
    //   author_id, gross_amount, commission_amount, net_amount, currency, created_at
    // order_items columns: id, order_id, learning_product_id, product_title, price_snapshot
    // orders columns: id, customer_name, customer_email, provider_ref, total
    // commissions: payment_reference = paystack provider_ref
    // -------------------------------------------------------
    const enriched = await Promise.all(
      (transactions || []).map(async (tx: any) => {
        if (tx.type !== 'SALE_CREDIT' || !tx.related_id) return tx;

        try {
          // 1. Fetch author_sale record
          const { data: sale } = await supabaseAdmin
            .from('author_sales')
            .select('id, order_id, order_item_id, product_id, gross_amount, commission_amount, net_amount')
            .eq('id', tx.related_id)
            .maybeSingle();

          if (!sale) return tx;

          // 2. Fetch order_item for product title (has product_title column directly)
          const { data: orderItem } = await supabaseAdmin
            .from('order_items')
            .select('id, product_title, price_snapshot, learning_product_id')
            .eq('id', sale.order_item_id)
            .maybeSingle();

          // 3. Fetch order for student details and provider_ref (needed for commission lookup)
          const { data: order } = await supabaseAdmin
            .from('orders')
            .select('id, customer_name, customer_email, provider_ref')
            .eq('id', sale.order_id)
            .maybeSingle();

          // 4. Fetch affiliate commission using provider_ref + product_id
          let affiliateCommission: number | null = null;
          let affiliateCommissionRate: number | null = null;
          let affiliateName: string | null = null;

          if (order?.provider_ref) {
            const { data: commission } = await supabaseAdmin
              .from('commissions')
              .select('amount, referrer_id, referrer_type, referral_code')
              .eq('payment_reference', order.provider_ref)
              .eq('learning_product_id', sale.product_id)
              .maybeSingle();

            if (commission) {
              affiliateCommission = commission.amount;

              // Calculate rate from gross amount
              if (sale.gross_amount && commission.amount) {
                affiliateCommissionRate = Math.round((commission.amount / sale.gross_amount) * 100);
              }

              // Get partner name
              const { data: partner } = await supabaseAdmin
                .from('partners')
                .select('full_name')
                .eq('id', commission.referrer_id)
                .maybeSingle();
              affiliateName = partner?.full_name || `Affiliate (${commission.referral_code})`;
            }
          }

          // 5. Calculate platform commission rate
          const grossAmount = sale.gross_amount || orderItem?.price_snapshot || tx.amount;
          const totalCommission = sale.commission_amount || 0;
          const netAmount = sale.net_amount || tx.amount;
          // Platform commission = total commission - affiliate commission
          const platformCommission = totalCommission - (affiliateCommission || 0);
          const platformCommissionRate = grossAmount > 0
            ? Math.round((platformCommission / grossAmount) * 100)
            : null;

          return {
            ...tx,
            // Course info
            course_title: orderItem?.product_title || null,
            student_email: order?.customer_email || null,
            student_name: order?.customer_name || null,
            // Amounts
            gross_amount: grossAmount,
            platform_commission: platformCommission > 0 ? platformCommission : null,
            platform_commission_rate: platformCommissionRate,
            affiliate_commission: affiliateCommission,
            affiliate_commission_rate: affiliateCommissionRate,
            affiliate_name: affiliateName,
            net_amount: netAmount,
          };
        } catch (e) {
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
