import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  try {
    await requireAdmin();

    // Get partner counts by type
    const { count: studentCount } = await supabaseAdmin
      .from('partners')
      .select('*', { count: 'exact', head: true })
      .eq('partner_type', 'student')
      .eq('status', 'active');

    const { count: communityCount } = await supabaseAdmin
      .from('partners')
      .select('*', { count: 'exact', head: true })
      .eq('partner_type', 'community')
      .eq('status', 'active');

    const { count: influencerCount } = await supabaseAdmin
      .from('partners')
      .select('*', { count: 'exact', head: true })
      .eq('partner_type', 'influencer')
      .eq('status', 'active');

    // Get pending applications
    const { count: pendingApplications } = await supabaseAdmin
      .from('partner_applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Get pending withdrawals
    const { count: pendingWithdrawals } = await supabaseAdmin
      .from('withdrawals')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Get open fraud alerts
    const { count: openFraudAlerts } = await supabaseAdmin
      .from('fraud_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open');

    // Get financial stats
    const { data: paidWithdrawals } = await supabaseAdmin
      .from('withdrawals')
      .select('amount')
      .eq('status', 'paid');

    const totalPaidOut = paidWithdrawals?.reduce((sum, w) => sum + w.amount, 0) || 0;

    const { data: allCommissions } = await supabaseAdmin
      .from('commissions')
      .select('amount')
      .neq('status', 'reversed');

    const totalCommissions = allCommissions?.reduce((sum, c) => sum + c.amount, 0) || 0;

    // Get referral stats
    const { count: totalClicks } = await supabaseAdmin
      .from('referral_clicks')
      .select('*', { count: 'exact', head: true });

    const { data: referralCodes } = await supabaseAdmin
      .from('referral_codes')
      .select('total_registrations');

    const totalRegistrations = referralCodes?.reduce((sum, rc) => sum + (rc.total_registrations || 0), 0) || 0;

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { count: recentSignups } = await supabaseAdmin
      .from('partners')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo);

    const { count: recentPurchases } = await supabaseAdmin
      .from('commissions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo);

    return NextResponse.json({
      success: true,
      stats: {
        partners: {
          student: studentCount || 0,
          community: communityCount || 0,
          influencer: influencerCount || 0,
          total: (studentCount || 0) + (communityCount || 0) + (influencerCount || 0)
        },
        applications: {
          pending: pendingApplications || 0
        },
        withdrawals: {
          pending: pendingWithdrawals || 0,
          totalPaidOut
        },
        fraud: {
          openAlerts: openFraudAlerts || 0
        },
        financial: {
          totalCommissions,
          totalPaidOut,
          availableForPayout: totalCommissions - totalPaidOut
        },
        referrals: {
          totalClicks: totalClicks || 0,
          totalRegistrations
        },
        recent: {
          signups: recentSignups || 0,
          purchases: recentPurchases || 0
        }
      }
    });

  } catch (error) {
    console.error('[GET /api/admin/growth-center/overview] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}