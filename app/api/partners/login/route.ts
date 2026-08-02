import { NextResponse } from 'next/server';
import { CommunityAuthService } from '@/lib/growth-engine/CommunityAuthService';
import { SessionService } from '@/lib/growth-engine/SessionService';
import { PartnerService } from '@/lib/growth-engine/PartnerService';
import { logReferralEvent } from '@/lib/audit-logging';

export async function POST(request: Request) {
  try {
    const { email, password, partnerType } = await request.json();

    if (!email || !password || !partnerType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (partnerType !== 'community' && partnerType !== 'influencer') {
      return NextResponse.json({ error: 'Invalid partner type' }, { status: 400 });
    }

    // Authenticate based on partner type
    const authResult = partnerType === 'community' 
      ? await CommunityAuthService.authenticate(email, password)
      : await CommunityAuthService.authenticateInfluencer(email, password);

    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Invalid credentials' }, { status: 401 });
    }

    // Get partner record
    const partner = partnerType === 'community'
      ? await PartnerService.getPartnerByCommunityAmbassadorId(authResult.user.id)
      : await PartnerService.getPartnerByInfluencerId(authResult.user.id);

    if (!partner) {
      return NextResponse.json({ error: 'Partner record not found' }, { status: 404 });
    }

    if (partner.status !== 'active') {
      return NextResponse.json({ error: 'Account is not active' }, { status: 403 });
    }

    // Create session
    await SessionService.createSession(authResult.user.id, partnerType);

    // Update last login
    const tableName = partnerType === 'community' ? 'community_ambassadors' : 'influencers';
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/internal/update-last-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: tableName, userId: authResult.user.id })
    });

    await logReferralEvent({
      action: 'partner_login',
      category: 'auth',
      user_id: authResult.user.id,
      description: `${partnerType} partner logged in`,
      metadata: { email, partnerId: partner.id }
    });

    return NextResponse.json({ 
      success: true, 
      user: authResult.user,
      partner: {
        id: partner.id,
        type: partner.partner_type,
        name: partner.full_name,
        email: partner.email,
        commissionRate: partner.commission_rate
      }
    });

  } catch (error) {
    console.error('[POST /api/partners/login] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}