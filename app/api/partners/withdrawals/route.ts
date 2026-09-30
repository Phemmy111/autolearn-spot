import { NextResponse } from 'next/server';
import { SessionService } from '@/lib/growth-engine/SessionService';
import { PartnerWithdrawalService } from '@/lib/partner-system/PartnerWithdrawalService';
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

    // Flat partner lookup — supports all partner types (affiliate, community, influencer, etc.)
    const { data: partner } = await supabaseAdmin
      .from('partners')
      .select('*')
      .or(
        `id.eq.${session.userId},clerk_user_id.eq.${session.userId}`
      )
      .maybeSingle();

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
      .maybeSingle();

    if (!bankProfile) {
      return NextResponse.json({ error: 'Bank profile not found. Please add your bank details first.' }, { status: 400 });
    }

    // Submit withdrawal using new service
    const result = await PartnerWithdrawalService.createWithdrawal(
      partner.id,
      amount,
      bankProfile.bank_name,
      bankProfile.account_number,
      bankProfile.account_name
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to submit withdrawal' }, { status: 400 });
    }

    return NextResponse.json({ success: true, withdrawal: result.withdrawal });
  } catch (error) {
    console.error('[POST /api/partners/withdrawals] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await SessionService.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Flat partner lookup
    const { data: partner } = await supabaseAdmin
      .from('partners')
      .select('id')
      .or(`id.eq.${session.userId},clerk_user_id.eq.${session.userId}`)
      .maybeSingle();

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    const { data: withdrawals } = await supabaseAdmin
      .from('partner_withdrawals')
      .select('*')
      .eq('partner_id', partner.id)
      .order('created_at', { ascending: false });

    return NextResponse.json({ withdrawals: withdrawals || [] });
  } catch (error) {
    console.error('[GET /api/partners/withdrawals] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
