import { NextResponse } from 'next/server';
import { ReferralService } from '@/lib/growth-engine/ReferralService';

export async function POST(request: Request) {
  try {
    const { code, userAgent, referrer } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Referral code is required' }, { status: 400 });
    }

    // Track the click
    await ReferralService.trackReferralClick(code, {
      userAgent,
      referrerUrl: referrer,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[POST /api/referrals/track] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}