import { NextResponse } from 'next/server';
import { SessionService } from '@/lib/growth-engine/SessionService';
import { PartnerService } from '@/lib/growth-engine/PartnerService';
import { createClient } from '@supabase/supabase-js';
import { logReferralEvent } from '@/lib/audit-logging';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  try {
    const session = await SessionService.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let partner;
    if (session.role === 'community') {
      partner = await PartnerService.getPartnerByCommunityAmbassadorId(session.userId);
    } else if (session.role === 'influencer') {
      partner = await PartnerService.getPartnerByInfluencerId(session.userId);
    } else {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    const { data: bankProfile } = await supabaseAdmin
      .from('partner_bank_profiles')
      .select('*')
      .eq('partner_id', partner.id)
      .single();

    return NextResponse.json({ success: true, bankProfile });
  } catch (error) {
    console.error('[GET /api/partners/bank-profile] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await SessionService.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let partner;
    if (session.role === 'community') {
      partner = await PartnerService.getPartnerByCommunityAmbassadorId(session.userId);
    } else if (session.role === 'influencer') {
      partner = await PartnerService.getPartnerByInfluencerId(session.userId);
    } else {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    const { bank_name, account_number, account_name } = await request.json();

    if (!bank_name || !account_number || !account_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Upsert bank profile
    const { data: bankProfile, error } = await supabaseAdmin
      .from('partner_bank_profiles')
      .upsert({
        partner_id: partner.id,
        bank_name,
        account_number,
        account_name
      })
      .select()
      .single();

    if (error) {
      console.error('[PUT /api/partners/bank-profile] Error:', error);
      return NextResponse.json({ error: 'Failed to save bank profile' }, { status: 500 });
    }

    await logReferralEvent({
      action: 'bank_profile_updated',
      category: 'profile',
      user_id: session.userId,
      description: `Partner ${partner.id} updated bank profile`,
      metadata: { partnerId: partner.id, bankName }
    });

    return NextResponse.json({ success: true, bankProfile });
  } catch (error) {
    console.error('[PUT /api/partners/bank-profile] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}