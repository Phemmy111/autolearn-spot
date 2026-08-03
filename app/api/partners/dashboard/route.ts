import { NextResponse } from 'next/server';
import { SessionService } from '@/lib/growth-engine/SessionService';
import { PartnerService } from '@/lib/growth-engine/PartnerService';
import { CommissionService } from '@/lib/growth-engine/CommissionService';
import { ReferralService } from '@/lib/growth-engine/ReferralService';
import { WithdrawalService } from '@/lib/growth-engine/WithdrawalService';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  try {
    // Check session
    const session = await SessionService.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get partner based on role
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

    // Update partner stats
    await PartnerService.updatePartnerStats(partner.id);

    // Get referral code
    const referralStats = await ReferralService.getReferralStats(partner.id);

    // Get earnings
    const earnings = await CommissionService.getEarnings(partner.id);

    // Get referral link
    const referralLink = referralStats 
      ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://autolearnspot.com'}/register?ref=${referralStats.code}`
      : null;

    // Get recent commissions
    const recentCommissions = await CommissionService.listCommissions({
      referrerId: partner.id
    }).then(comms => comms.slice(0, 10));

    // Get withdrawal history
    const withdrawals = await WithdrawalService.listWithdrawals({
      userId: partner.id
    });

    // Get bank profile
    const { data: bankProfile } = await supabaseAdmin
      .from('partner_bank_profiles')
      .select('*')
      .eq('partner_id', partner.id)
      .single();

    // Get notifications
    const { data: notifications } = await supabaseAdmin
      .from('partner_notifications')
      .select('*')
      .eq('partner_id', partner.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Unread count
    const { count: unreadCount } = await supabaseAdmin
      .from('partner_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('partner_id', partner.id)
      .eq('read', false);

    // Get marketing resources
    const { data: marketingResources } = await supabaseAdmin
      .from('marketing_materials')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    return NextResponse.json({
      success: true,
      partner: {
        id: partner.id,
        type: partner.partner_type,
        name: partner.full_name,
        email: partner.email,
        commissionRate: partner.commission_rate,
        status: partner.status
      },
      stats: {
        totalClicks: partner.total_clicks,
        totalRegistrations: partner.total_registrations,
        totalPaymentsInitiated: partner.total_payments_initiated,
        totalSuccessfulPurchases: partner.total_successful_purchases,
        pendingEarnings: partner.pending_earnings,
        availableEarnings: partner.available_earnings,
        lifetimeEarnings: partner.lifetime_earnings,
        totalWithdrawn: partner.total_withdrawn
      },
      referral: {
        code: referralStats?.code,
        link: referralLink,
        totalClicks: referralStats?.totalClicks || 0,
        totalRegistrations: referralStats?.totalRegistrations || 0
      },
      bankProfile,
      recentCommissions,
      withdrawals,
      notifications,
      unreadCount: unreadCount || 0,
      marketingResources
    });

  } catch (error) {
    console.error('[GET /api/partners/dashboard] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}