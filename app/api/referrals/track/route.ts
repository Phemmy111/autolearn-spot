import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export const dynamic = 'force-dynamic';

async function recordReferralClick(code: string, ipAddress?: string, userAgent?: string, referrerUrl?: string) {
  if (!code) return false;

  try {
    // 1. Try finding in referral_codes by code
    let { data: refCode } = await supabaseAdmin
      .from('referral_codes')
      .select('id, code, owner_id, partner_id, clicks')
      .eq('code', code)
      .maybeSingle();

    // 2. If not found in referral_codes directly, check affiliate_links.unique_code
    if (!refCode) {
      const { data: affLink } = await supabaseAdmin
        .from('affiliate_links')
        .select('id, referral_code_id, unique_code')
        .eq('unique_code', code)
        .maybeSingle();

      if (affLink?.referral_code_id) {
        const { data: rc } = await supabaseAdmin
          .from('referral_codes')
          .select('id, code, owner_id, partner_id, clicks')
          .eq('id', affLink.referral_code_id)
          .maybeSingle();
        refCode = rc;
      }
    }

    if (!refCode) {
      console.warn(`[ReferralTrack] Code not found: ${code}`);
      return false;
    }

    // Increment clicks on referral_codes
    const newClicks = (refCode.clicks || 0) + 1;
    await supabaseAdmin
      .from('referral_codes')
      .update({ clicks: newClicks })
      .eq('id', refCode.id);

    // Increment total_clicks on partners
    const partnerId = refCode.partner_id || refCode.owner_id;
    if (partnerId) {
      const { data: partner } = await supabaseAdmin
        .from('partners')
        .select('id, total_clicks')
        .or(`id.eq.${partnerId},partner_id.eq.${partnerId},user_id.eq.${partnerId}`)
        .maybeSingle();

      if (partner) {
        await supabaseAdmin
          .from('partners')
          .update({ total_clicks: (partner.total_clicks || 0) + 1 })
          .eq('id', partner.id);
      }
    }

    return true;
  } catch (err) {
    console.error('[ReferralTrack] Error recording click:', err);
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ref = searchParams.get('ref') || searchParams.get('code');

    if (!ref) {
      return NextResponse.json({ error: 'Referral code required' }, { status: 400 });
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const referrerUrl = request.headers.get('referer') || request.headers.get('referrer') || null;

    await recordReferralClick(ref, ipAddress, userAgent, referrerUrl || undefined);

    const response = NextResponse.json({ success: true, referralCode: ref });
    const maxAge = 30 * 24 * 60 * 60; // 30 days
    response.cookies.set('affiliate_ref', ref, { path: '/', maxAge, sameSite: 'lax' });
    response.cookies.set('referral_code', ref, { path: '/', maxAge, sameSite: 'lax' });
    response.cookies.set('als_referral', ref, { path: '/', maxAge, sameSite: 'lax' });

    return response;
  } catch (error) {
    console.error('[GET /api/referrals/track] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const ref = body?.code || body?.ref;

    if (!ref) {
      return NextResponse.json({ error: 'Referral code required' }, { status: 400 });
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = body?.userAgent || request.headers.get('user-agent') || 'unknown';
    const referrerUrl = body?.referrer || request.headers.get('referer') || null;

    await recordReferralClick(ref, ipAddress, userAgent, referrerUrl || undefined);

    const response = NextResponse.json({ success: true, referralCode: ref });
    const maxAge = 30 * 24 * 60 * 60; // 30 days
    response.cookies.set('affiliate_ref', ref, { path: '/', maxAge, sameSite: 'lax' });
    response.cookies.set('referral_code', ref, { path: '/', maxAge, sameSite: 'lax' });
    response.cookies.set('als_referral', ref, { path: '/', maxAge, sameSite: 'lax' });

    return response;
  } catch (error) {
    console.error('[POST /api/referrals/track] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
