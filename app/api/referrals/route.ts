import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ReferralService } from '@/lib/growth-engine/ReferralService';
import { CommissionService } from '@/lib/growth-engine/CommissionService';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const referralCode = await ReferralService.getOrCreateReferralCode(userId);
    
    if (!referralCode) {
      return NextResponse.json({ error: 'Failed to retrieve referral code' }, { status: 500 });
    }

    // Release any matured commissions (pending → available)
    await CommissionService.releaseMaturedCommissions();

    // Get real earnings from CommissionService
    const earnings = await CommissionService.getEarnings(userId);

    // Always use the primary domain / scholarship application for the link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://autolearnspot.com';
    const shareUrl = `${baseUrl}/scholarship/apply?ref=${referralCode.code}`;

    return NextResponse.json({
      success: true,
      referralCode: referralCode.code,
      shareUrl,
      totalClicks: referralCode.total_clicks || 0,
      totalRegistrations: referralCode.total_registrations || 0,
      pendingEarnings: earnings.pendingEarnings,
      availableEarnings: earnings.availableEarnings,
    });
  } catch (error) {
    console.error('[GET /api/referrals] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}
