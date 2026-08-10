import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ReferralService } from '@/lib/growth-engine/ReferralService';
import { CommissionService } from '@/lib/growth-engine/CommissionService';
import { PartnerService } from '@/lib/growth-engine/PartnerService';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get student partner record using the Clerk user ID directly
    // The webhook sets clerk_user_id to the actual Clerk user ID
    const { data: partner, error: partnerError } = await supabaseAdmin
      .from('partners')
      .select('*')
      .eq('clerk_user_id', userId) // Use the Clerk user ID directly
      .eq('partner_type', 'student')
      .eq('status', 'active')
      .single();

    if (partnerError || !partner) {
      return NextResponse.json({ 
        success: false,
        error: 'Not an active student partner' 
      }, { status: 200 });
    }

    // Get or create referral code
    // Use partner.id (UUID) as the owner_id since that's the correct linking
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

    // Update partner stats using the correct method
    await PartnerService.updatePartnerStats(partner.id);

    // Get earnings using the correct referrer_id
    // For student partners, commissions use clerk_user_id as referrer_id
    const earnings = await CommissionService.getEarnings(partner.clerk_user_id);

    // Get referral link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://autolearn-spot.vercel.app';
    const referralLink = referralStats
      ? `${appUrl}/enroll?ref=${referralStats.code}`
      : null;

    // Get recent commissions using correct referrer_id
    const recentCommissions = await CommissionService.listCommissions({
      referrerId: partner.clerk_user_id
    }).then(comms => comms.slice(0, 10));

    // Get recent referrals (from enrollments table)
    const { data: recentReferrals } = await supabaseAdmin
      .from('enrollments')
      .select('email, created_at, status, referred_by_code')
      .eq('referred_by_code', referralStats?.code)
      .order('created_at', { ascending: false })
      .limit(10);

    // Format recent referrals for display
    const formattedReferrals = recentReferrals?.map(ref => ({
      email: ref.email,
      date: ref.created_at,
      status: ref.status === 'active' ? 'completed' : 
             ref.status === 'pending' ? 'pending' : 'failed',
      commission: ref.status === 'active' ? partner.commission_rate : 0
    })) || [];

    // Format commissions for display
    const formattedCommissions = recentCommissions?.map(commission => ({
      refereeEmail: commission.referee_email,
      createdAt: commission.created_at,
      amount: commission.amount,
      status: commission.status
    })) || [];

    // Get marketing resources for student partners
    const { data: marketingResources } = await supabaseAdmin
      .from('partner_marketing_downloads')
      .select('*')
      .order('created_at', { ascending: false });

    // Get bank profile for student partner
    const { data: bankProfile } = await supabaseAdmin
      .from('partner_bank_profiles')
      .select('*')
      .eq('partner_id', partner.id)
      .single();

    // Fetch updated partner stats after updatePartnerStats
    const { data: updatedPartner } = await supabaseAdmin
      .from('partners')
      .select('total_clicks, total_registrations, available_earnings, pending_earnings, lifetime_earnings')
      .eq('id', partner.id)
      .single();

    return NextResponse.json({
      success: true,
      data: {
        partner: {
          id: partner.id,
          name: partner.full_name,
          email: partner.email,
          commissionRate: partner.commission_rate,
          status: partner.status
        },
        referralCode: referralStats?.code,
        referralLink,
        stats: {
          totalClicks: updatedPartner?.total_clicks || 0,
          totalRegistrations: updatedPartner?.total_registrations || 0,
          pendingEarnings: updatedPartner?.pending_earnings || 0,
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