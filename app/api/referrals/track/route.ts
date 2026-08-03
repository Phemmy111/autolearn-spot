import { NextRequest, NextResponse } from 'next/server';
import { PartnerReferralService } from '@/lib/partner-system/PartnerReferralService';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ref = searchParams.get('ref');

    if (!ref) {
      return NextResponse.json({ error: 'Referral code required' }, { status: 400 });
    }

    // Get client info for tracking
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const referrerUrl = request.headers.get('referer') || request.headers.get('referrer') || null;

    // Extract UTM parameters
    const utmParams: Record<string, string> = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(param => {
      const value = searchParams.get(param);
      if (value) utmParams[param] = value;
    });

    // Track the referral click
    const tracked = await PartnerReferralService.trackReferralClick(
      ref,
      ipAddress,
      userAgent,
      referrerUrl,
      utmParams
    );

    if (!tracked) {
      return NextResponse.json({ error: 'Failed to track referral' }, { status: 500 });
    }

    // Set cookie to track referral for subsequent actions
    const response = NextResponse.json({ success: true, referralCode: ref });
    response.cookies.set('als_referral', ref, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    });

    return response;
  } catch (error) {
    console.error('Error tracking referral:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}