import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ReferralService } from '@/lib/growth-engine/ReferralService';
import { CommissionService } from '@/lib/growth-engine/CommissionService';
import { PartnerService } from '@/lib/growth-engine/PartnerService';
import { getPartnershipSettings } from '@/lib/partnership-settings';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // 1. Fetch live admin partnership settings
    const partnershipSettings = await getPartnershipSettings();

    // 2. Look for student partner record using Clerk user ID
    let { data: partner } = await supabaseAdmin
      .from('partners')
      .select('*')
      .eq('clerk_user_id', userId)
      .eq('partner_type', 'student')
      .maybeSingle();

    // 3. AUTO-ACTIVATION: If not yet in partners table, check if user is an enrolled student!
    if (!partner) {
      const { data: enrollment } = await supabaseAdmin
        .from('enrollments')
        .select('id, email, clerk_user_id, status')
        .or(`clerk_user_id.eq.${userId},user_id.eq.${userId}`)
        .limit(1)
        .maybeSingle();

      if (enrollment) {
        console.log(`[StudentPartner] Auto-activating enrolled student ${userId} as partner...`);
        const { data: createdPartner, error: createErr } = await supabaseAdmin
          .from('partners')
          .insert({
            clerk_user_id: userId,
            email: enrollment.email || 'student@autolearnspot.com',
            full_name: 'Enrolled Student',
            partner_type: 'student',
            commission_rate: partnershipSettings.studentCommission,
            status: 'active',
            available_earnings: 0,
            pending_earnings: 0,
            total_earnings: 0,
            paid_earnings: 0,
          })
          .select()
          .single();

        if (createdPartner && !createErr) {
          partner = createdPartner;
          await ReferralService.getOrCreateReferralCode(partner.id, 'student');
        }
      }
    }

    // 4. If still not a partner (and has zero enrollments), return not_partner with dynamic settings
    if (!partner || partner.status !== 'active') {
      return NextResponse.json({ 
        success: false,
        error: 'Not an active student partner',
        commissionRate: partnershipSettings.studentCommission,
        minWithdrawal: partnershipSettings.minWithdrawal,
        holdingPeriodDays: partnershipSettings.holdingPeriodDays
      }, { status: 200 });
    }

    // 5. Get or create referral code
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

    // Update partner stats
    await PartnerService.updatePartnerStats(partner.id);

    // Get referral link (points directly to the AI Automation course with ref param)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.autolearnspot.com';
    const referralLink = referralStats
      ? `${appUrl}/learning_products/c1e11cc7-d8f6-4c2d-8a3b-1bb204892921?ref=${referralStats.code}`
      : null;

    // Get recent commissions
    const recentCommissions = await CommissionService.listCommissions({
      referrerId: partner.clerk_user_id
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
      commission: ref.status === 'active' || ref.status === 'completed' ? (partner?.commission_rate || partnershipSettings.studentCommission) : 0
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

    // Fetch pending withdrawals to display real pending earnings
    const { data: pendingWds } = await supabaseAdmin
      .from('author_withdrawals')
      .select('amount')
      .eq('author_id', partner.id)
      .eq('status', 'PENDING');

    const pendingEarningsTotal = (pendingWds || []).reduce((sum, w) => sum + (Number(w.amount) || 0), 0);

    // Updated stats
    const { data: updatedPartner } = await supabaseAdmin
      .from('partners')
      .select('total_clicks, total_registrations, available_earnings, total_earnings')
      .eq('id', partner.id)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        partner: {
          id: partner.id,
          name: partner.full_name,
          email: partner.email,
          commissionRate: partnershipSettings.studentCommission, // Live dynamic admin commission
          status: partner.status
        },
        commissionRate: partnershipSettings.studentCommission,
        minWithdrawal: partnershipSettings.minWithdrawal,
        holdingPeriodDays: partnershipSettings.holdingPeriodDays,
        referralCode: referralStats?.code,
        referralLink,
        stats: {
          totalClicks: updatedPartner?.total_clicks || 0,
          totalRegistrations: updatedPartner?.total_registrations || 0,
          pendingEarnings: pendingEarningsTotal,
          availableBalance: updatedPartner?.available_earnings || 0
        },
        recentReferrals: formattedReferrals,
        commissions: formattedCommissions,
        marketingResources: marketingResources || [],
        bankProfile
      }
    });

  } catch (error) {
    console.error('[GET /api/partners/student-dashboard] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
