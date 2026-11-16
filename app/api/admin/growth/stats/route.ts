import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  try {
    // Basic stats
    const { count: referralCodeCount } = await supabaseAdmin
      .from('referral_codes')
      .select('*', { count: 'exact', head: true });

    const { count: partnerCount } = await supabaseAdmin
      .from('partners')
      .select('*', { count: 'exact', head: true });

    // Total payouts
    const { data: paidWithdrawals } = await supabaseAdmin
      .from('author_withdrawals')
      .select('amount')
      .eq('status', 'PAID');

    const totalPayouts =
      paidWithdrawals?.reduce((sum, w) => sum + (Number(w.amount) || 0), 0) ?? 0;

    // Total commissions generated
    const { data: allCommissions } = await supabaseAdmin
      .from('commissions')
      .select('amount');

    const totalCommissions =
      allCommissions?.reduce((sum, c) => sum + (Number(c.amount) || 0), 0) ?? 0;

    return NextResponse.json({
      success: true,
      stats: {
        studentAmbassadors: referralCodeCount || 0,
        communityAmbassadors: partnerCount || 0,
        influencerPartners: partnerCount || 0,
        totalPayouts,
        totalCommissions,
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
