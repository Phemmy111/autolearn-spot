import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ReferralService } from '@/lib/growth-engine/ReferralService';
import { CommissionService } from '@/lib/growth-engine/CommissionService';
import { PartnerService } from '@/lib/growth-engine/PartnerService';
import { getPartnershipSettings } from '@/lib/partnership-settings';
import { getOrResolveAuthenticatedPartner } from '@/lib/partner-system/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const partnershipSettings = await getPartnershipSettings();

    // Universal partner resolver
    let partner = await getOrResolveAuthenticatedPartner();

    if (!partner) {
      const { searchParams } = new URL(request.url);
      const userId = searchParams.get('userId');
      if (userId) {
        const { data: matched } = await supabaseAdmin
          .from('partners')
          .select('*')
          .or(`id.eq.${userId},user_id.eq.${userId},partner_id.eq.${userId}`)
          .limit(1)
          .maybeSingle();
        partner = matched;
      }
    }

    if (!partner) {
      return NextResponse.json({ 
        success: false,
        error: 'Not an active student partner',
        commissionRate: partnershipSettings.studentCommission,
        minWithdrawal: partnershipSettings.minWithdrawal,
        holdingPeriodDays: partnershipSettings.holdingPeriodDays
      }, { status: 200 });
    }

    // Update partner stats
    await PartnerService.updatePartnerStats(partner.id);

    // Get or create referral code
    let referralStats = await ReferralService.getReferralStats(partner.id);
    if (!referralStats) {
      const referralCode = await ReferralService.getOrCreateReferralCode(partner.id, 'student');
      if (referralCode) {
        referralStats = {
          code: referralCode.code,
          totalClicks: referralCode.total_clicks,
          totalRegistrations: referralCode.total_registrations,
          ownerType: referralCode.owner_type
        };
      }
    }

    // Get referral link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.autolearnspot.com';
    const referralLink = referralStats
      ? `${appUrl}/enroll?ref=${referralStats.code}`
      : null;

    // Get earnings
    const earnings = await CommissionService.getEarnings([partner.id, partner.user_id].filter(Boolean));

    // Get recent commissions
    const recentCommissions = await CommissionService.listCommissions({
      referrerId: [partner.id, partner.user_id].filter(Boolean)
    }).then(comms => comms.slice(0, 10));

    // Get recent referrals
    const { data: recentReferrals } = await supabaseAdmin
      .from('enrollments')
      .select('email, created_at, status, referred_by_code')
      .eq('referred_by_code', referralStats?.code)
      .order('created_at', { ascending: false })
      .limit(10);

    const formattedReferrals = recentReferrals?.map(ref => ({
      email: ref.email,
      date: ref.created_at,
      status: ref.status === 'active' || ref.status === 'completed' ? 'completed' : 
             ref.status === 'pending' ? 'pending' : 'failed',
      commission: ref.status === 'active' || ref.status === 'completed' ? partnershipSettings.studentCommission : 0
    })) || [];

    const formattedCommissions = recentCommissions?.map(commission => ({
      refereeEmail: commission.referee_email,
      createdAt: commission.created_at,
      amount: commission.amount,
      status: commission.status
    })) || [];

    // Marketing downloads
    const { data: marketingResources } = await supabaseAdmin
      .from('partner_marketing_downloads')
      .select('*')
      .order('created_at', { ascending: false });

    // Bank profile
    const { data: bankProfile } = await supabaseAdmin
      .from('partner_bank_profiles')
      .select('*')
      .eq('partner_id', partner.id)
      .maybeSingle();

    // Fetch pending withdrawals
    const { data: pendingWds } = await supabaseAdmin
      .from('author_withdrawals')
      .select('amount')
      .eq('author_id', partner.id)
      .eq('status', 'PENDING');

    const totalPendingWithdrawal = (pendingWds || []).reduce((sum, w) => sum + (Number(w.amount) || 0), 0);

    // Recent withdrawals
    const { data: recentWithdrawals } = await supabaseAdmin
      .from('author_withdrawals')
      .select('*')
      .eq('author_id', partner.id)
      .order('created_at', { ascending: false })
      .limit(10);

    const formattedWithdrawals = (recentWithdrawals || []).map((w: any) => ({
      id: w.id,
      amount: Number(w.amount) || 0,
      status: (w.status || 'pending').toLowerCase(),
      reference: w.reference || (w.id ? w.id.slice(0, 8) : 'WD-REF'),
      created_at: w.created_at,
      updated_at: w.updated_at
    }));

    return NextResponse.json({
      success: true,
      data: {
        partnerId: partner.id,
        alsId: partner.partner_id || 'ALS0000',
        name: partner.name || 'Student Partner',
        email: partner.email,
        commissionRate: partnershipSettings.studentCommission,
        minWithdrawal: partnershipSettings.minWithdrawal,
        holdingPeriodDays: partnershipSettings.holdingPeriodDays,
        referralCode: referralStats?.code,
        referralLink,
        stats: {
          totalClicks: partner.total_clicks || referralStats?.totalClicks || 0,
          totalReferrals: partner.total_registrations || referralStats?.totalRegistrations || 0,
          availableBalance: Math.max(Number(partner.available_earnings) || 0, earnings.availableEarnings || 0),
          pendingEarnings: earnings.pendingEarnings || 0,
          pendingWithdrawals: totalPendingWithdrawal,
          lifetimeEarnings: Math.max(Number(partner.total_earnings) || 0, earnings.lifetimeEarnings || 0),
        },
        recentReferrals: formattedReferrals,
        recentCommissions: formattedCommissions,
        withdrawals: formattedWithdrawals,
        bankProfile,
        marketingResources: marketingResources || []
      }
    });

  } catch (error) {
    console.error('[GET /api/partners/student-dashboard] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
