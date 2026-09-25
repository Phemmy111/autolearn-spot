import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '@/lib/growth-engine/SessionService';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

function generateAffiliateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return 'AFF' + Array.from({ length: 7 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// POST: Create an affiliate link for a product
export async function POST(request: NextRequest) {
  const session = await SessionService.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { learning_product_id } = body;
  if (!learning_product_id) return NextResponse.json({ error: 'learning_product_id required' }, { status: 400 });

  const { data: partner } = await supabaseAdmin
    .from('partners')
    .select('id')
    .eq('clerk_user_id', session.userId)
    .eq('status', 'active')
    .single();

  if (!partner) return NextResponse.json({ error: 'Partner not found' }, { status: 404 });

  const { data: product } = await supabaseAdmin
    .from('learning_products')
    .select('id, slug, affiliate_enabled, affiliate_commission_rate')
    .eq('id', learning_product_id)
    .single();

  if (!product || !product.affiliate_enabled) {
    return NextResponse.json({ error: 'This product does not accept affiliates' }, { status: 400 });
  }

  // Check if already exists
  const { data: existing } = await supabaseAdmin
    .from('affiliate_links')
    .select('id, referral_code_id')
    .eq('partner_id', partner.id)
    .eq('learning_product_id', learning_product_id)
    .single();

  if (existing) {
    const { data: refCode } = await supabaseAdmin
      .from('referral_codes')
      .select('code')
      .eq('id', existing.referral_code_id)
      .single();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://autolearn-spot.vercel.app';
    return NextResponse.json({
      id: existing.id,
      affiliate_url: `${appUrl}/marketplace/${product.slug}?ref=${refCode?.code}`,
      code: refCode?.code,
      already_existed: true,
    });
  }

  // Create referral code
  const code = generateAffiliateCode();
  const { data: refCode, error: refError } = await supabaseAdmin
    .from('referral_codes')
    .insert({ owner_id: partner.id, owner_type: 'affiliate', code, status: 'Active' })
    .select('id, code')
    .single();

  if (refError || !refCode) return NextResponse.json({ error: 'Failed to create referral code' }, { status: 500 });

  const { data: link, error: linkError } = await supabaseAdmin
    .from('affiliate_links')
    .insert({ partner_id: partner.id, learning_product_id, referral_code_id: refCode.id })
    .select('id')
    .single();

  if (linkError || !link) return NextResponse.json({ error: 'Failed to create affiliate link' }, { status: 500 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://autolearn-spot.vercel.app';
  return NextResponse.json({
    id: link.id,
    affiliate_url: `${appUrl}/marketplace/${product.slug}?ref=${refCode.code}`,
    code: refCode.code,
    already_existed: false,
  });
}

// GET: List all affiliate links for current partner
export async function GET() {
  const session = await SessionService.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: partner } = await supabaseAdmin
    .from('partners')
    .select('id')
    .eq('clerk_user_id', session.userId)
    .eq('status', 'active')
    .single();

  if (!partner) return NextResponse.json({ error: 'Partner not found' }, { status: 404 });

  const { data: links } = await supabaseAdmin
    .from('affiliate_links')
    .select('id, learning_product_id, referral_code_id, clicks, conversions, total_earned, created_at')
    .eq('partner_id', partner.id)
    .order('created_at', { ascending: false });

  if (!links || links.length === 0) return NextResponse.json([]);

  const productIds = [...new Set(links.map((l: any) => l.learning_product_id))];
  const { data: products } = await supabaseAdmin
    .from('learning_products')
    .select('id, title, slug, price, affiliate_commission_rate, thumbnail_url')
    .in('id', productIds);

  const productMap = Object.fromEntries((products || []).map((p: any) => [p.id, p]));

  const codeIds = links.map((l: any) => l.referral_code_id).filter(Boolean);
  const { data: codes } = codeIds.length > 0
    ? await supabaseAdmin.from('referral_codes').select('id, code').in('id', codeIds)
    : { data: [] };

  const codeMap = Object.fromEntries((codes || []).map((c: any) => [c.id, c.code]));

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://autolearn-spot.vercel.app';
  const enriched = links.map((l: any) => {
    const product = productMap[l.learning_product_id] || {};
    const code = codeMap[l.referral_code_id] || '';
    return {
      ...l,
      product,
      code,
      affiliate_url: product.slug ? `${appUrl}/marketplace/${product.slug}?ref=${code}` : null,
    };
  });

  return NextResponse.json(enriched);
}
