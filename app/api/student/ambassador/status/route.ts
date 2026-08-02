import { NextResponse } from 'next/server';
import { ReferralService } from '@/lib/growth-engine/ReferralService';
import { CommissionService } from '@/lib/growth-engine/CommissionService';
import { createClient } from '@supabase/supabase-js';

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

    // Check application status
    const { data: application, error: appError } = await supabaseAdmin
      .from('ambassador_applications')
      .select('status')
      .eq('user_id', userId)
      .single();

    if (appError || !application) {
      return NextResponse.json({ success: true, status: 'not_applied' });
    }

    if (application.status === 'pending') {
      return NextResponse.json({ success: true, status: 'pending' });
    }
    
    if (application.status === 'rejected') {
      // Allow reapply
      return NextResponse.json({ success: true, status: 'not_applied' });
    }

    // Approved - Get Dashboard Data
    let referralCodeData = await ReferralService.getOrCreateReferralCode(userId, 'student');
    if (!referralCodeData) {
      return NextResponse.json({ error: 'Failed to retrieve referral code' }, { status: 500 });
    }

    await CommissionService.releaseMaturedCommissions();
    const earnings = await CommissionService.getEarnings(userId);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://autolearnspot.com';
    const shareUrl = `${baseUrl}/scholarship/apply?ref=${referralCodeData.code}`;

    // Get recent commissions
    const { data: commissions } = await supabaseAdmin
      .from('commissions')
      .select('*')
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
      
    // Get withdrawals
    const { data: withdrawals } = await supabaseAdmin
      .from('withdrawals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      success: true,
      status: 'approved',
      data: {
        referralCode: referralCodeData.code,
        shareUrl,
        totalClicks: referralCodeData.total_clicks || 0,
        totalRegistrations: referralCodeData.total_registrations || 0,
        earnings,
        commissions: commissions || [],
        withdrawals: withdrawals || []
      }
    });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
