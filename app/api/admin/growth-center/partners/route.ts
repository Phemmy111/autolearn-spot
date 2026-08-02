import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { PartnerService } from '@/lib/growth-engine/PartnerService';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const partnerType = searchParams.get('type') as 'student' | 'community' | 'influencer' | undefined;
    const status = searchParams.get('status') as 'active' | 'suspended' | 'inactive' | undefined;
    const search = searchParams.get('search') || undefined;

    const partners = await PartnerService.listPartners({
      partnerType,
      status,
      search
    });

    return NextResponse.json({ success: true, partners });
  } catch (error) {
    console.error('[GET /api/admin/growth-center/partners] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const { userId: adminId } = await auth();
    if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { action, partnerId, ...params } = await request.json();

    if (action === 'create_influencer') {
      const result = await PartnerService.createInfluencerPartner({
        adminId,
        fullName: params.fullName,
        email: params.email,
        phone: params.phone,
        platform: params.platform,
        followers: params.followers,
        category: params.category,
        customCommissionRate: params.customCommissionRate
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({ 
        success: true, 
        partner: result.partner,
        temporaryPassword: result.temporaryPassword 
      });
    }

    if (action === 'update_status' && partnerId) {
      const result = await PartnerService.updatePartnerStatus(
        partnerId,
        params.status,
        adminId,
        params.reason
      );

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'update_commission' && partnerId) {
      const result = await PartnerService.updateInfluencerCommission(
        partnerId,
        params.newRate,
        adminId
      );

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[POST /api/admin/growth-center/partners] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}