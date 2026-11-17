import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export const dynamic = 'force-dynamic';

function generateAffiliateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return 'AF' + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { partnerId, learningProductId } = body;

    if (!partnerId || !learningProductId) {
      return NextResponse.json(
        { error: 'partnerId and learningProductId are required' },
        { status: 400 }
      );
    }

    // 1. Fetch Partner
    const { data: partner, error: partnerError } = await supabaseAdmin
      .from('partners')
      .select('*')
      .or(`id.eq.${partnerId},partner_id.eq.${partnerId}`)
      .single();

    if (partnerError || !partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    // 2. Fetch Product
    const { data: product, error: prodError } = await supabaseAdmin
      .from('learning_products')
      .select('id, title, slug, price, affiliate_enabled, affiliate_commission_rate')
      .eq('id', learningProductId)
      .single();

    if (prodError || !product) {
      return NextResponse.json({ error: 'Course / Product not found' }, { status: 404 });
    }

    // 3. Find or Create Referral Code for Partner
    const { data: existingCodes } = await supabaseAdmin
      .from('referral_codes')
      .select('id, code')
      .or(`owner_id.eq.${partner.id},partner_id.eq.${partner.id}`)
      .limit(1);

    let refCode = existingCodes?.[0];
    if (!refCode) {
      const newCode = generateAffiliateCode();
      const { data: created, error: createError } = await supabaseAdmin
        .from('referral_codes')
        .insert({
          owner_id: partner.id,
          partner_id: partner.id,
          code: newCode,
          clicks: 0,
          conversions: 0
        })
        .select('id, code')
        .single();

      if (createError || !created) {
        throw createError || new Error('Failed to create referral code');
      }
      refCode = created;
    }

    // 4. Check if affiliate link already exists
    const { data: existingLink } = await supabaseAdmin
      .from('affiliate_links')
      .select('id, unique_code')
      .eq('referral_code_id', refCode.id)
      .eq('learning_product_id', product.id)
      .maybeSingle();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.autolearnspot.com';
    const linkCode = existingLink?.unique_code || refCode.code;

    if (existingLink) {
      return NextResponse.json({
        success: true,
        alreadyExisted: true,
        link: {
          id: existingLink.id,
          url: `${appUrl}/marketplace/${product.slug || product.id}?ref=${linkCode}`,
          code: linkCode,
          product_title: product.title
        }
      });
    }

    // 5. Create affiliate link
    const { data: newLink, error: linkError } = await supabaseAdmin
      .from('affiliate_links')
      .insert({
        referral_code_id: refCode.id,
        learning_product_id: product.id,
        unique_code: refCode.code
      })
      .select('id, unique_code')
      .single();

    if (linkError) throw linkError;

    return NextResponse.json({
      success: true,
      alreadyExisted: false,
      link: {
        id: newLink.id,
        url: `${appUrl}/marketplace/${product.slug || product.id}?ref=${newLink.unique_code}`,
        code: newLink.unique_code,
        product_title: product.title
      }
    });
  } catch (error: any) {
    console.error('[POST /api/admin/partners/generate-link] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
