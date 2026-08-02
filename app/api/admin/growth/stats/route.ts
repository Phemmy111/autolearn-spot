import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  try {
    // Basic stats
    const { count: studentCount } = await supabaseAdmin.from('referral_codes').select('*', { count: 'exact', head: true }).eq('owner_type', 'student');
    const { count: communityCount } = await supabaseAdmin.from('community_ambassadors').select('*', { count: 'exact', head: true });
    const { count: influencerCount } = await supabaseAdmin.from('influencers').select('*', { count: 'exact', head: true });
    
    // Total payouts
    const { data: paidWithdrawals } = await supabaseAdmin.from('withdrawals').select('amount').eq('status', 'paid');
    const totalPayouts = paidWithdrawals?.reduce((sum, w) => sum + w.amount, 0) || 0;

    // Total commissions generated
    const { data: allCommissions } = await supabaseAdmin.from('commissions').select('amount').neq('status', 'reversed');
    const totalCommissions = allCommissions?.reduce((sum, c) => sum + c.amount, 0) || 0;

    return NextResponse.json({
      success: true,
      stats: {
        studentAmbassadors: studentCount || 0,
        communityAmbassadors: communityCount || 0,
        influencerPartners: influencerCount || 0,
        totalPayouts,
        totalCommissions
      }
    });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
