import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createClient } from '@supabase/supabase-js';
import { AdminEmailService } from '@/lib/growth-engine/AdminEmailService';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

function generatePartnerId(): string {
  const prefix = 'ALS';
  const suffix = Math.floor(1000 + Math.random() * 9000).toString();
  return `${prefix}${suffix}`;
}

function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { data: partners, error } = await supabaseAdmin
      .from('partners')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch all referral codes to associate with partners
    const { data: refCodes } = await supabaseAdmin
      .from('referral_codes')
      .select('id, code, owner_id, partner_id, clicks, conversions');

    // Fetch all product-specific affiliate links with product details
    const { data: affiliateLinks } = await supabaseAdmin
      .from('affiliate_links')
      .select(`
        id,
        unique_code,
        referral_code_id,
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
      `);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.autolearnspot.com';

    // Map referral_code_id -> array of product links
    const linksByRefCodeId = new Map<string, any[]>();
    (affiliateLinks || []).forEach((link: any) => {
      const prod = link.learning_products;
      const formatted = {
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
      const arr = linksByRefCodeId.get(link.referral_code_id) || [];
      arr.push(formatted);
      linksByRefCodeId.set(link.referral_code_id, arr);
    });

    // Map partner identifiers -> array of product links
    const linksByPartnerId = new Map<string, any[]>();
    (refCodes || []).forEach((rc) => {
      const links = linksByRefCodeId.get(rc.id) || [];
      if (links.length > 0) {
        if (rc.partner_id) {
          const arr = linksByPartnerId.get(rc.partner_id) || [];
          linksByPartnerId.set(rc.partner_id, [...arr, ...links]);
        }
        if (rc.owner_id && rc.owner_id !== rc.partner_id) {
          const arr = linksByPartnerId.get(rc.owner_id) || [];
          linksByPartnerId.set(rc.owner_id, [...arr, ...links]);
        }
      }
    });

    const enriched = (partners || []).map((p) => {
      const partnerLinks = linksByPartnerId.get(p.id) || linksByPartnerId.get(p.partner_id) || [];
      return {
        ...p,
        full_name: p.name || p.full_name || 'Partner',
        name: p.name || p.full_name || 'Partner',
        partner_id: p.partner_id || 'N/A',
        promoted_products: partnerLinks,
        promoted_products_count: partnerLinks.length,
        partner_type: p.partner_type || 'affiliate',
      };
    });

    return NextResponse.json({ success: true, partners: enriched });
  } catch (error: any) {
    console.error('[GET /api/admin/partners] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const {
      full_name,
      name,
      email,
      phone,
      whatsapp,
      status,
    } = body;

    const partnerName = (full_name || name || '').trim();
    const partnerEmail = (email || '').trim().toLowerCase();

    if (!partnerName || !partnerEmail) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Check if partner already exists
    const { data: existing } = await supabaseAdmin
      .from('partners')
      .select('id, email, status')
      .eq('email', partnerEmail)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'A partner with this email already exists' },
        { status: 400 }
      );
    }

    const partnerId = generatePartnerId();

    // Insert only existing columns
    const insertData = {
      partner_id: partnerId,
      name: partnerName,
      email: partnerEmail,
      phone: phone || whatsapp || null,
      status: status || 'active',
      total_clicks: 0,
      total_registrations: 0,
      available_earnings: 0,
      total_earnings: 0,
    };

    const { data: partner, error: partnerError } = await supabaseAdmin
      .from('partners')
      .insert(insertData)
      .select()
      .single();

    if (partnerError) {
      console.error('[POST /api/admin/partners] Error inserting partner:', partnerError);
      return NextResponse.json(
        { error: partnerError.message || 'Failed to create partner' },
        { status: 500 }
      );
    }

    // Automatically create a referral code for this partner
    const referralCode = generateReferralCode();
    await supabaseAdmin.from('referral_codes').insert({
      code: referralCode,
      owner_id: partner.id,
      partner_id: partner.id,
      clicks: 0,
      conversions: 0,
    });

    // Optionally notify
    try {
      await AdminEmailService.sendPartnerWelcomeEmail({
        partnerName: partnerName,
        partnerEmail: partnerEmail,
        partnerId: partner.partner_id,
        partnerType: 'affiliate',
        referralCode: referralCode,
        tempPassword: 'Use your email OTP code to log in at /partners/login',
      });
    } catch (e) {
      console.warn('[POST /api/admin/partners] Welcome email notification skipped or failed:', e);
    }

    return NextResponse.json({
      success: true,
      partner: {
        ...partner,
        referral_code: referralCode,
      },
    });
  } catch (error: any) {
    console.error('[POST /api/admin/partners] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { id, status, name, phone } = body;

    if (!id) {
      return NextResponse.json({ error: 'Partner ID required' }, { status: 400 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;

    const { data, error } = await supabaseAdmin
      .from('partners')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, partner: data });
  } catch (error: any) {
    console.error('[PATCH /api/admin/partners] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Partner ID required' }, { status: 400 });
    }

    // Clean up referral codes & links if any
    await supabaseAdmin
      .from('referral_codes')
      .delete()
      .or(`owner_id.eq.${id},partner_id.eq.${id}`);

    const { error } = await supabaseAdmin
      .from('partners')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[DELETE /api/admin/partners] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
