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

    // Get partner by session userId (matches partner.id, partner.user_id, or partner.partner_id)
    let partner = null;
    const { data: matchedPartners } = await supabaseAdmin
      .from('partners')
      .select('*')
      .or(`id.eq.${session.userId},user_id.eq.${session.userId},partner_id.eq.${session.userId}`)
      .order('created_at', { ascending: false })
      .limit(1);

    if (matchedPartners && matchedPartners.length > 0) {
      partner = matchedPartners[0];
    }

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    // Update partner stats
    await PartnerService.updatePartnerStats(partner.id);

    // Get referral code, create one if it doesn't exist
    let referralStats = await ReferralService.getReferralStats(partner.id);
    
    if (!referralStats) {
      // Determine owner type based on partner type
      const ownerType = partner.partner_type === 'influencer' ? 'influencer' : 
                       partner.partner_type === 'student' ? 'student' : 'community';
      
      // Create referral code
      const referralCode = await ReferralService.getOrCreateReferralCode(partner.id, ownerType);
      
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
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.autolearnspot.com';
    const referralLink = referralStats
      ? `${appUrl}/enroll?ref=${referralStats.code}`
      : null;

    // Get recent commissions enriched with student names
    const rawCommissions = await CommissionService.listCommissions({
      referrerId: partner.id
    }).then(comms => comms.slice(0, 20));

    const refereeEmails = [...new Set(rawCommissions.map(c => c.referee_email).filter(Boolean))];
    const { data: customerOrders } = refereeEmails.length > 0
      ? await supabaseAdmin
          .from('orders')
          .select('customer_email, customer_name')
          .in('customer_email', refereeEmails)
      : { data: [] };

    const nameMap = Object.fromEntries(
      (customerOrders || [])
        .filter(o => o.customer_name && o.customer_email)
        .map(o => [o.customer_email, o.customer_name])
    );

    const recentCommissions = rawCommissions.map(c => ({
      ...c,
      referred_name: nameMap[c.referee_email] || (c.referee_email ? c.referee_email.split('@')[0] : 'Student Referral')
    }));

    // Get withdrawal history from author_withdrawals (used by partner withdrawal service)
    const { data: authorWithdrawals } = await supabaseAdmin
      .from('author_withdrawals')
      .select('*')
      .eq('author_id', partner.id)
      .order('created_at', { ascending: false });

    const formattedWithdrawals = (authorWithdrawals || []).map((w: any) => ({
      id: w.id,
      amount: Number(w.amount) || 0,
      status: (w.status || 'pending').toLowerCase(),
      reference: w.reference || (w.id ? w.id.slice(0, 8) : 'WD-REF'),
      created_at: w.created_at,
      updated_at: w.updated_at
    }));

    // Get bank profile
    const { data: bankProfile } = await supabaseAdmin
      .from('partner_bank_profiles')
      .select('*')
      .eq('partner_id', partner.id)
      .maybeSingle();

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

    // Get marketing resources from the correct table
    const { data: marketingResources } = await supabaseAdmin
      .from('partner_marketing_downloads')
      .select('*')
      .order('created_at', { ascending: false });

    // Transform marketing resources to match frontend expectations
    const transformedMarketingResources = marketingResources?.map(item => ({
      id: item.id,
      name: item.resource_name,
      type: item.resource_type,
      category: item.category,
      description: item.description,
      url: item.resource_url,
      file_url: item.resource_url,
      download_count: item.download_count,
      created_at: item.created_at
    })) || [];

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
      withdrawals: formattedWithdrawals,
      notifications,
      unreadCount: unreadCount || 0,
      marketingResources: transformedMarketingResources
    });

  } catch (error) {
    console.error('[GET /api/partners/dashboard] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
