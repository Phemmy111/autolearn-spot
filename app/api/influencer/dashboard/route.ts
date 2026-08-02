import { NextResponse } from 'next/server';
import { SessionService } from '@/lib/growth-engine/SessionService';
import { ReferralService } from '@/lib/growth-engine/ReferralService';
import { CommissionService } from '@/lib/growth-engine/CommissionService';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    const session = await SessionService.getSession();
    if (!session || session.role !== 'influencer') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from('influencers')
      .select('id, full_name, email, commission_rate, platform')
      .eq('id', session.userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let referralCodeData = await ReferralService.getOrCreateReferralCode(user.id, 'influencer');
    if (!referralCodeData) {
      return NextResponse.json({ error: 'Failed to retrieve referral code' }, { status: 500 });
    }

    await CommissionService.releaseMaturedCommissions();
    const earnings = await CommissionService.getEarnings(user.id);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://autolearnspot.com';
    const shareUrl = `${baseUrl}/scholarship/apply?ref=${referralCodeData.code}`;

    // Get recent commissions
    const { data: commissions } = await supabaseAdmin
      .from('commissions')
      .select('*')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
      
    // Get withdrawals
    const { data: withdrawals } = await supabaseAdmin
      .from('withdrawals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      success: true,
      user,
      referralCode: referralCodeData.code,
      shareUrl,
      totalClicks: referralCodeData.total_clicks || 0,
      totalRegistrations: referralCodeData.total_registrations || 0,
      earnings,
      commissions: commissions || [],
      withdrawals: withdrawals || []
    });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
