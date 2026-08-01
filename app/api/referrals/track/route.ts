import { NextResponse } from 'next/server';
import { ReferralService } from '@/lib/growth-engine/ReferralService';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ success: true }); // Silently ignore invalid codes
    }

    // Extract basic metadata
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;
    const referrerUrl = request.headers.get('referer') || undefined;

    // Track the click asynchronously (wait for it to prevent Vercel from killing the request early)
    await ReferralService.trackReferralClick(code, {
      ipAddress,
      userAgent,
      referrerUrl
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[POST /api/referrals/track] Error:', error);
    return NextResponse.json({ success: true }); // Never leak errors on tracking
  }
}
