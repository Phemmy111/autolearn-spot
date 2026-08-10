import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ReferralService } from '@/lib/growth-engine/ReferralService';
import { CommissionService } from '@/lib/growth-engine/CommissionService';

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

    // Get user from Clerk ID
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('clerk_user_id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get student partner record
    const { data: partner, error: partnerError } = await supabaseAdmin
      .from('partners')
      .select('*')
      .eq('clerk_user_id', user.id)
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

    // Get earnings
    const earnings = await CommissionService.getEarnings(partner.id);

    // Get referral link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://autolearn-spot.vercel.app';
    const referralLink = referralStats
      ? `${appUrl}/enroll?ref=${referralStats.code}`
      : null;

    // Get recent commissions
    const recentCommissions = await CommissionService.listCommissions({
      referrerId: partner.id
    }).then(comms => comms.slice(0, 10));

    // Get recent referrals (from enrollments table)
    const { data: recentReferrals } = await supabaseAdmin
      .from('enrollments')
      .select('email, created_at, payment_status, referred_by')
      .eq('referred_by', partner.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Format recent referrals for display
    const formattedReferrals = recentReferrals?.map(ref => ({
      email: ref.email,
      date: ref.created_at,
      status: ref.payment_status === 'completed' ? 'completed' : 
             ref.payment_status === 'pending' ? 'pending' : 'failed',
      commission: ref.payment_status === 'completed' ? 1500 : 0
    })) || [];

    // Format commissions for display
    const formattedCommissions = recentCommissions?.map(commission => ({
      refereeEmail: commission.referee_email,
      createdAt: commission.created_at,
      amount: commission.amount,
      status: commission.status
    })) || [];

    // Update partner stats
    await supabaseAdmin
      .from('partners')
      .update({
        total_clicks: referralStats?.totalClicks || 0,
        total_registrations: referralStats?.totalRegistrations || 0,
        available_earnings: earnings?.available || 0,
        pending_earnings: earnings?.pending || 0,
        lifetime_earnings: earnings?.lifetime || 0
      })
      .eq('id', partner.id);

    // Get marketing resources for student partners
    const { data: marketingResources } = await supabaseAdmin
      .from('partner_marketing_downloads')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

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
          totalClicks: referralStats?.totalClicks || 0,
          totalRegistrations: referralStats?.totalRegistrations || 0,
          pendingEarnings: earnings?.pending || 0,
          availableBalance: earnings?.available || 0
        },
        recentReferrals: formattedReferrals,
        commissions: formattedCommissions,
        marketingResources: marketingResources || []
      }
    });

  } catch (error) {
    console.error('[GET /api/partners/student-dashboard] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}