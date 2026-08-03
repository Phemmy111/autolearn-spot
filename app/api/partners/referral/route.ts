import { NextRequest, NextResponse } from 'next/server';
import { PartnerReferralService } from '@/lib/partner-system/PartnerReferralService';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await PartnerReferralService.getOrCreateReferralCode(userId);

    if (!result) {
      return NextResponse.json({ error: 'Failed to get referral code' }, { status: 500 });
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Error getting referral code:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}