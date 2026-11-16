import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '@/lib/growth-engine/SessionService';
import { PartnerService } from '@/lib/growth-engine/PartnerService';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

function generateAffiliateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return 'AF' + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

async function resolvePartner(session: { userId: string; role?: string }) {
  const { data: matchedPartners } = await supabaseAdmin
    .from('partners')
    .select('*')
    .or(`id.eq.${session.userId},user_id.eq.${session.userId},partner_id.eq.${session.userId}`)
    .order('created_at', { ascending: false })
    .limit(1);

  return (matchedPartners && matchedPartners.length > 0) ? matchedPartners[0] : null;
}

// POST: Create an affiliate link for a product
export async function POST(request: NextRequest) {
  const session = await SessionService.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { learning_product_id } = body;
  if (!learning_product_id) return NextResponse.json({ error: 'learning_product_id required' }, { status: 400 });

  const partner = await resolvePartner(session);
  if (!partner) return NextResponse.json({ error: 'Partner not found' }, { status: 404 });

  const { data: product } = await supabaseAdmin
    .from('learning_products')
    .select('id, slug, affiliate_enabled, affiliate_commission_rate')
    .eq('id', learning_product_id)
    .single();

  if (!product || product.affiliate_enabled === false) {
    return NextResponse.json({ error: 'This product does not accept affiliates' }, { status: 400 });
  }

  // 1. Fetch partner's existing referral codes
  const { data: partnerCodes } = await supabaseAdmin
    .from('referral_codes')
    .select('id, code, clicks, conversions')
    .or(`owner_id.eq.${partner.id},partner_id.eq.${partner.id}`);

  const codeIds = (partnerCodes || []).map((c: any) => c.id);

  // 2. Check if an affiliate link already exists for this partner & product
  if (codeIds.length > 0) {
    const { data: existing } = await supabaseAdmin
      .from('affiliate_links')
      .select('id, referral_code_id, unique_code')
      .eq('learning_product_id', learning_product_id)
      .in('referral_code_id', codeIds)
      .limit(1)
      .maybeSingle();

    if (existing) {
      const matchingCode = partnerCodes?.find((c: any) => c.id === existing.referral_code_id);
      const codeStr = existing.unique_code || matchingCode?.code;
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.autolearnspot.com';
      return NextResponse.json({
        id: existing.id,
        affiliate_url: `${appUrl}/marketplace/${product.slug || product.id}?ref=${codeStr}`,
        code: codeStr,
        already_existed: true,
      });
    }
  }

  // 3. Use partner's existing referral code or create a new one
  let refCode = partnerCodes?.[0];
  if (!refCode) {
    const code = generateAffiliateCode();
    const { data: createdCode, error: refError } = await supabaseAdmin
      .from('referral_codes')
      .insert({
        owner_id: partner.id,
        partner_id: partner.id,
        code,
        clicks: 0,
        conversions: 0,
      })
      .select('id, code')
      .single();

    if (refError || !createdCode) {
      console.error('[Affiliate Links POST] Error creating referral code:', refError);
      return NextResponse.json({ error: refError?.message || 'Failed to create referral code' }, { status: 500 });
    }
    refCode = createdCode;
  }

  // 4. Create affiliate link record in affiliate_links
  const { data: link, error: linkError } = await supabaseAdmin
    .from('affiliate_links')
    .insert({
      referral_code_id: refCode.id,
      learning_product_id,
      unique_code: refCode.code,
    })
    .select('id, unique_code')
    .single();

  if (linkError || !link) {
    console.error('[Affiliate Links POST] Error creating affiliate link:', linkError);
    return NextResponse.json({ error: linkError?.message || 'Failed to create affiliate link' }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.autolearnspot.com';
  return NextResponse.json({
    id: link.id,
    affiliate_url: `${appUrl}/marketplace/${product.slug || product.id}?ref=${refCode.code}`,
    code: refCode.code,
    already_existed: false,
  });
}

// GET: List all affiliate links for current partner
export async function GET() {
  const session = await SessionService.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const partner = await resolvePartner(session);
  if (!partner) return NextResponse.json({ error: 'Partner not found' }, { status: 404 });

  // 1. Get all referral codes owned by this partner
  const { data: partnerCodes } = await supabaseAdmin
    .from('referral_codes')
    .select('id, code, clicks, conversions')
    .or(`owner_id.eq.${partner.id},partner_id.eq.${partner.id}`);

  if (!partnerCodes || partnerCodes.length === 0) return NextResponse.json([]);

  const codeMap = Object.fromEntries(partnerCodes.map((c: any) => [c.id, c]));
  const codeIds = partnerCodes.map((c: any) => c.id);

  // 2. Fetch affiliate links for these codes
  const { data: links } = await supabaseAdmin
    .from('affiliate_links')
    .select('id, learning_product_id, referral_code_id, unique_code, created_at')
    .in('referral_code_id', codeIds)
    .order('created_at', { ascending: false });

  if (!links || links.length === 0) return NextResponse.json([]);

  const productIds = [...new Set(links.map((l: any) => l.learning_product_id))];
  const { data: products } = await supabaseAdmin
    .from('learning_products')
    .select('id, title, slug, price, affiliate_commission_rate, thumbnail_url')
    .in('id', productIds);

  const productMap = Object.fromEntries((products || []).map((p: any) => [p.id, p]));

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.autolearnspot.com';
  const enriched = links.map((l: any) => {
    const product = productMap[l.learning_product_id] || {};
    const refCodeObj = codeMap[l.referral_code_id];
    const code = l.unique_code || refCodeObj?.code || '';
    return {
      ...l,
      product,
      code,
      clicks: refCodeObj?.clicks || 0,
      conversions: refCodeObj?.conversions || 0,
      affiliate_url: product.slug ? `${appUrl}/marketplace/${product.slug}?ref=${code}` : `${appUrl}/marketplace/${l.learning_product_id}?ref=${code}`,
    };
  });

  return NextResponse.json(enriched);
}
