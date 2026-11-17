import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('partnerId');

    if (!partnerId) {
      return NextResponse.json({ error: 'Partner ID required' }, { status: 400 });
    }

    // 1. Fetch partner info
    const { data: partner, error: partnerError } = await supabaseAdmin
      .from('partners')
      .select('*')
      .or(`id.eq.${partnerId},partner_id.eq.${partnerId}`)
      .single();

    if (partnerError || !partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    const actualId = partner.id;

    // 2. Fetch bank details
    const { data: bankDetails } = await supabaseAdmin
      .from('partner_bank_profiles')
      .select('*')
      .eq('partner_id', actualId)
      .maybeSingle();

    // 3. Fetch referral code & product-specific affiliate links
    const { data: referralCodes } = await supabaseAdmin
      .from('referral_codes')
      .select('*')
      .or(`owner_id.eq.${actualId},partner_id.eq.${actualId}`);

    const codeIds = (referralCodes || []).map((rc) => rc.id);

    let formattedLinks: any[] = [];
    if (codeIds.length > 0) {
      const { data: affiliateLinks } = await supabaseAdmin
        .from('affiliate_links')
        .select(`
          id,
          unique_code,
          learning_product_id,
          created_at,
          learning_products (
            id,
            title,
            slug,
            price,
            affiliate_commission_rate,
            thumbnail_url
          )
        `)
        .in('referral_code_id', codeIds);

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.autolearnspot.com';
      formattedLinks = (affiliateLinks || []).map((link: any) => {
        const prod = link.learning_products;
        return {
          id: link.id,
          product_id: link.learning_product_id,
          title: prod?.title || 'Course',
          slug: prod?.slug,
          price: prod?.price || 0,
          commission_rate: prod?.affiliate_commission_rate || 20,
          commission_amount: prod?.price ? Math.round((prod.price * (prod.affiliate_commission_rate || 20)) / 100) : 0,
          unique_code: link.unique_code,
          url: `${appUrl}/marketplace/${prod?.slug || link.learning_product_id}?ref=${link.unique_code}`,
          created_at: link.created_at,
        };
      });
    }

    // 4. Fetch commissions history
    const { data: commissions } = await supabaseAdmin
      .from('commissions')
      .select('*')
      .eq('referrer_id', actualId)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      success: true,
      partner: {
        ...partner,
        full_name: partner.name,
        partner_id: partner.partner_id || 'N/A',
        partner_type: 'affiliate',
      },
      bankDetails: bankDetails || null,
      referralCodes: referralCodes || [],
      affiliateLinks: formattedLinks,
      promotedProducts: formattedLinks,
      commissions: commissions || [],
    });
  } catch (error: any) {
    console.error('[GET /api/admin/partner-details] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
