import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '@/lib/growth-engine/SessionService';
import { PartnerService } from '@/lib/growth-engine/PartnerService';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

async function resolvePartner(session: { userId: string; role?: string }) {
  const { data: matchedPartners } = await supabaseAdmin
    .from('partners')
    .select('*')
    .or(`id.eq.${session.userId},user_id.eq.${session.userId},partner_id.eq.${session.userId}`)
    .order('created_at', { ascending: false })
    .limit(1);

  return (matchedPartners && matchedPartners.length > 0) ? matchedPartners[0] : null;
}

export async function GET() {
  const session = await SessionService.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get partner record
  const partner = await resolvePartner(session);
  if (!partner) return NextResponse.json({ error: 'Partner not found' }, { status: 404 });

  // Fetch all published products
  const { data: products, error } = await supabaseAdmin
    .from('learning_products')
    .select('id, title, slug, price, thumbnail_url, affiliate_enabled, affiliate_commission_rate, status')
    .eq('status', 'PUBLISHED');

  if (error) {
    console.error('[Affiliate Marketplace] Error fetching products:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 1. Fetch partner's referral codes
  const { data: partnerCodes } = await supabaseAdmin
    .from('referral_codes')
    .select('id')
    .or(`owner_id.eq.${partner.id},partner_id.eq.${partner.id}`);

  const codeIds = (partnerCodes || []).map((c: any) => c.id);

  // 2. Check which products the partner already has links for
  const { data: existingLinks } = codeIds.length > 0
    ? await supabaseAdmin
        .from('affiliate_links')
        .select('id, learning_product_id')
        .in('referral_code_id', codeIds)
    : { data: [] };

  const promotingSet = new Set((existingLinks || []).map((l: any) => l.learning_product_id));

  // Include products that don't have affiliate_enabled explicitly set to false
  const enriched = (products || [])
    .filter((p: any) => p.affiliate_enabled !== false)
    .map((p: any) => {
      const commissionRate = p.affiliate_commission_rate || partner.commission_rate || 20;
      const price = Number(p.price) || 0;
      return {
        ...p,
        affiliate_commission_rate: commissionRate,
        already_promoting: promotingSet.has(p.id),
        affiliate_link_id: (existingLinks || []).find((l: any) => l.learning_product_id === p.id)?.id || null,
        potential_earning: Math.round(price * (commissionRate / 100)),
      };
    });

  return NextResponse.json(enriched);
}
