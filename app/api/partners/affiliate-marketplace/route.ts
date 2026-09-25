import { NextResponse } from 'next/server';
import { SessionService } from '@/lib/growth-engine/SessionService';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/partners/affiliate-marketplace
 * Returns all affiliate-enabled published learning products,
 * annotated with whether the current partner is already promoting each one.
 */
export async function GET() {
  try {
    const session = await SessionService.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve the partners row from the session userId (ambassador/influencer id)
    let partnerQuery;
    if (session.role === 'community') {
      partnerQuery = supabaseAdmin
        .from('partners')
        .select('id')
        .eq('community_ambassador_id', session.userId)
        .single();
    } else {
      partnerQuery = supabaseAdmin
        .from('partners')
        .select('id')
        .eq('influencer_id', session.userId)
        .single();
    }

    const { data: partner, error: partnerError } = await partnerQuery;

    if (partnerError || !partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    // Fetch all eligible products (flat query — no joins)
    const { data: products, error: productsError } = await supabaseAdmin
      .from('learning_products')
      .select('id, title, slug, price, thumbnail_url, affiliate_commission_rate')
      .eq('affiliate_enabled', true)
      .eq('status', 'PUBLISHED');

    if (productsError) {
      console.error('[affiliate-marketplace] products error:', productsError);
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    if (!products || products.length === 0) {
      return NextResponse.json([]);
    }

    // Fetch all affiliate_links for this partner (flat query)
    const productIds = products.map((p) => p.id);
    const { data: existingLinks, error: linksError } = await supabaseAdmin
      .from('affiliate_links')
      .select('id, learning_product_id')
      .eq('partner_id', partner.id)
      .in('learning_product_id', productIds);

    if (linksError) {
      console.error('[affiliate-marketplace] links error:', linksError);
      // Non-fatal — just return products without promotion status
    }

    // Build a map: product_id -> affiliate_link_id
    const linkMap: Record<string, string> = {};
    for (const link of existingLinks ?? []) {
      linkMap[link.learning_product_id] = link.id;
    }

    const result = products.map((product) => ({
      id: product.id,
      title: product.title,
      slug: product.slug,
      price: product.price,
      thumbnail_url: product.thumbnail_url,
      affiliate_commission_rate: product.affiliate_commission_rate,
      already_promoting: !!linkMap[product.id],
      affiliate_link_id: linkMap[product.id] ?? null,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('[GET /api/partners/affiliate-marketplace] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
