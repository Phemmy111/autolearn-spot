import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '@/lib/growth-engine/SessionService';
import { PartnerService } from '@/lib/growth-engine/PartnerService';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

async function resolvePartner(session: { userId: string; role?: string }) {
  let partner = null;
  if (session.role === 'community') {
    partner = await PartnerService.getPartnerByCommunityAmbassadorId(session.userId);
  } else if (session.role === 'influencer') {
    partner = await PartnerService.getPartnerByInfluencerId(session.userId);
  } else if (session.role === 'student') {
    partner = await PartnerService.getPartnerByClerkUserId(session.userId);
  }

  if (!partner) {
    const { data } = await supabaseAdmin
      .from('partners')
      .select('*')
      .or(`id.eq.${session.userId},community_ambassador_id.eq.${session.userId},influencer_id.eq.${session.userId},clerk_user_id.eq.${session.userId}`)
      .maybeSingle();
    partner = data;
  }
  return partner;
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

  // Check which ones the partner is already promoting
  const { data: existingLinks } = await supabaseAdmin
    .from('affiliate_links')
    .select('id, learning_product_id')
    .eq('partner_id', partner.id);

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
