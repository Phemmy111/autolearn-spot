import { NextResponse } from 'next/server';
import { SessionService } from '@/lib/growth-engine/SessionService';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Generates a random 8-character uppercase alphanumeric referral code.
 */
function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Resolves the partners row id from the session.
 */
async function resolvePartnerId(
  session: { userId: string; role: 'community' | 'influencer' }
): Promise<string | null> {
  const column =
    session.role === 'community' ? 'community_ambassador_id' : 'influencer_id';

  const { data, error } = await supabaseAdmin
    .from('partners')
    .select('id')
    .eq(column, session.userId)
    .single();

  if (error || !data) return null;
  return data.id;
}

/**
 * POST /api/partners/affiliate-links
 * Creates an affiliate link for the current partner and a given learning_product_id.
 * Also creates a new referral_code entry and links it.
 */
export async function POST(request: Request) {
  try {
    const session = await SessionService.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const partnerId = await resolvePartnerId(session);
    if (!partnerId) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    const body = await request.json();
    const { learning_product_id } = body;

    if (!learning_product_id) {
      return NextResponse.json(
        { error: 'learning_product_id is required' },
        { status: 400 }
      );
    }

    // Check if an affiliate link already exists for this partner + product
    const { data: existing } = await supabaseAdmin
      .from('affiliate_links')
      .select('id, referral_code_id')
      .eq('partner_id', partnerId)
      .eq('learning_product_id', learning_product_id)
      .single();

    if (existing) {
      // Fetch the existing referral code to return the link
      const { data: existingCode } = await supabaseAdmin
        .from('referral_codes')
        .select('code')
        .eq('id', existing.referral_code_id)
        .single();

      // Fetch product slug
      const { data: product } = await supabaseAdmin
        .from('learning_products')
        .select('slug')
        .eq('id', learning_product_id)
        .single();

      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL || 'https://autolearn-spot.vercel.app';
      const affiliateUrl = `${appUrl}/marketplace/${product?.slug}?ref=${existingCode?.code}`;

      return NextResponse.json({
        success: true,
        affiliate_link_id: existing.id,
        url: affiliateUrl,
        code: existingCode?.code,
      });
    }

    // Fetch the product to validate it's eligible and get slug
    const { data: product, error: productError } = await supabaseAdmin
      .from('learning_products')
      .select('id, slug, affiliate_enabled, status')
      .eq('id', learning_product_id)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (!product.affiliate_enabled || product.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'This product is not available for affiliate promotion' },
        { status: 400 }
      );
    }

    // Generate a unique referral code
    let code = generateCode();
    let codeExists = true;
    let attempts = 0;

    while (codeExists && attempts < 10) {
      const { data: existingCodeRow } = await supabaseAdmin
        .from('referral_codes')
        .select('id')
        .eq('code', code)
        .single();

      if (!existingCodeRow) {
        codeExists = false;
      } else {
        code = generateCode();
        attempts++;
      }
    }

    if (codeExists) {
      return NextResponse.json(
        { error: 'Failed to generate unique referral code. Please try again.' },
        { status: 500 }
      );
    }

    // Insert referral code
    const { data: newCode, error: codeError } = await supabaseAdmin
      .from('referral_codes')
      .insert({
        code,
        owner_id: partnerId,
        owner_type: 'affiliate',
        is_active: true,
      })
      .select('id, code')
      .single();

    if (codeError || !newCode) {
      console.error('[affiliate-links POST] code insert error:', codeError);
      return NextResponse.json(
        { error: 'Failed to create referral code' },
        { status: 500 }
      );
    }

    // Insert affiliate link
    const { data: newLink, error: linkError } = await supabaseAdmin
      .from('affiliate_links')
      .insert({
        partner_id: partnerId,
        learning_product_id,
        referral_code_id: newCode.id,
        clicks: 0,
        conversions: 0,
        total_earned: 0,
      })
      .select('id')
      .single();

    if (linkError || !newLink) {
      console.error('[affiliate-links POST] link insert error:', linkError);
      return NextResponse.json(
        { error: 'Failed to create affiliate link' },
        { status: 500 }
      );
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'https://autolearn-spot.vercel.app';
    const affiliateUrl = `${appUrl}/marketplace/${product.slug}?ref=${newCode.code}`;

    return NextResponse.json({
      success: true,
      affiliate_link_id: newLink.id,
      url: affiliateUrl,
      code: newCode.code,
    });
  } catch (error) {
    console.error('[POST /api/partners/affiliate-links] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * GET /api/partners/affiliate-links
 * Returns all affiliate links for the current partner with product details.
 */
export async function GET() {
  try {
    const session = await SessionService.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const partnerId = await resolvePartnerId(session);
    if (!partnerId) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    // Fetch all affiliate links for this partner (flat)
    const { data: links, error: linksError } = await supabaseAdmin
      .from('affiliate_links')
      .select('id, learning_product_id, referral_code_id, clicks, conversions, total_earned')
      .eq('partner_id', partnerId)
      .order('id', { ascending: false });

    if (linksError) {
      console.error('[affiliate-links GET] links error:', linksError);
      return NextResponse.json({ error: 'Failed to fetch affiliate links' }, { status: 500 });
    }

    if (!links || links.length === 0) {
      return NextResponse.json([]);
    }

    // Collect product ids and referral code ids for batch fetching
    const productIds = [...new Set(links.map((l) => l.learning_product_id))];
    const codeIds = [...new Set(links.map((l) => l.referral_code_id).filter(Boolean))];

    // Fetch products (flat)
    const { data: products } = await supabaseAdmin
      .from('learning_products')
      .select('id, title, slug, price, affiliate_commission_rate')
      .in('id', productIds);

    // Fetch referral codes (flat)
    const { data: codes } = await supabaseAdmin
      .from('referral_codes')
      .select('id, code')
      .in('id', codeIds);

    // Build lookup maps
    const productMap: Record<string, any> = {};
    for (const p of products ?? []) {
      productMap[p.id] = p;
    }

    const codeMap: Record<string, string> = {};
    for (const c of codes ?? []) {
      codeMap[c.id] = c.code;
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'https://autolearn-spot.vercel.app';

    const result = links.map((link) => {
      const product = productMap[link.learning_product_id] ?? null;
      const code = link.referral_code_id ? codeMap[link.referral_code_id] : null;
      const url = product && code
        ? `${appUrl}/marketplace/${product.slug}?ref=${code}`
        : null;

      return {
        id: link.id,
        learning_product_id: link.learning_product_id,
        product_title: product?.title ?? 'Unknown Product',
        product_price: product?.price ?? 0,
        affiliate_commission_rate: product?.affiliate_commission_rate ?? 0,
        clicks: link.clicks ?? 0,
        conversions: link.conversions ?? 0,
        total_earned: link.total_earned ?? 0,
        code,
        url,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[GET /api/partners/affiliate-links] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
