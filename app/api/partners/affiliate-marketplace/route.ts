import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '@/lib/growth-engine/SessionService';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await SessionService.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get partner record
  const { data: partner } = await supabaseAdmin
    .from('partners')
    .select('id')
    .eq('clerk_user_id', session.userId)
    .eq('status', 'active')
    .single();

  if (!partner) return NextResponse.json({ error: 'Partner not found' }, { status: 404 });

  // Fetch all affiliate-enabled published products
  const { data: products, error } = await supabaseAdmin
    .from('learning_products')
    .select('id, title, slug, price, thumbnail_url, affiliate_enabled, affiliate_commission_rate, status')
    .eq('affiliate_enabled', true)
    .eq('status', 'PUBLISHED');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Check which ones the partner is already promoting
  const { data: existingLinks } = await supabaseAdmin
    .from('affiliate_links')
    .select('id, learning_product_id')
    .eq('partner_id', partner.id);

  const promotingSet = new Set((existingLinks || []).map((l: any) => l.learning_product_id));

  const enriched = (products || []).map((p: any) => ({
    ...p,
    already_promoting: promotingSet.has(p.id),
    affiliate_link_id: (existingLinks || []).find((l: any) => l.learning_product_id === p.id)?.id || null,
    potential_earning: Math.round(p.price * (p.affiliate_commission_rate / 100)),
  }));

  return NextResponse.json(enriched);
}
