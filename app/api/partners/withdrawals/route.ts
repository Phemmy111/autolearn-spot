import { NextResponse } from 'next/server';
import { SessionService } from '@/lib/growth-engine/SessionService';
import { PartnerService } from '@/lib/growth-engine/PartnerService';
import { WithdrawalService } from '@/lib/growth-engine/WithdrawalService';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
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

    const { amount } = await request.json();

    if (!amount || typeof amount !== 'number') {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Get bank profile
    const { data: bankProfile } = await supabaseAdmin
      .from('partner_bank_profiles')
      .select('*')
      .eq('partner_id', partner.id)
      .single();

    if (!bankProfile) {
      return NextResponse.json({ error: 'Bank profile not found. Please add your bank details first.' }, { status: 400 });
    }

    // Submit withdrawal
    const result = await WithdrawalService.submitWithdrawal({
      userId: partner.id,
      userType: partner.partner_type,
      amount,
      bankName: bankProfile.bank_name,
      accountNumber: bankProfile.account_number,
      accountName: bankProfile.account_name
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Update partner stats
    await PartnerService.updatePartnerStats(partner.id);

    return NextResponse.json({ success: true, withdrawal: result.withdrawal });
  } catch (error) {
    console.error('[POST /api/partners/withdrawals] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}