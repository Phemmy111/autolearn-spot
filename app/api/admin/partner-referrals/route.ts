import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('partnerId');
    
    if (!partnerId) {
      return NextResponse.json({ error: 'Partner ID required' }, { status: 400 });
    }
    
    console.log('[GET /api/admin/partner-referrals] V2 - Fetching for partner ID:', partnerId);
    
    // Get partner type to determine referrer_id
    const { data: partner, error: partnerError } = await supabaseAdmin
      .from('partners')
      .select('partner_type, clerk_user_id')
      .eq('id', partnerId)
      .single();
    
    console.log('[GET /api/admin/partner-referrals] V2 - Partner query result:', partner, partnerError);
    
    if (!partner) {
      console.error('[GET /api/admin/partner-referrals] V2 - Partner not found. Error:', partnerError);
      return NextResponse.json({ error: 'Partner not found', details: partnerError }, { status: 404 });
    }
    
    // For student partners, use clerk_user_id as referrer_id
    // For community/influencer partners, use partner.id
    const referrerId = partner.partner_type === 'student' ? partner.clerk_user_id : partnerId;
    
    console.log('[GET /api/admin/partner-referrals] V2 - Partner:', partnerId, 'Type:', partner.partner_type, 'Referrer ID:', referrerId);
    
    // Fetch recent referrals for this partner
    const { data: referrals, error } = await supabaseAdmin
      .from('commissions')
      .select('*')
      .eq('referrer_id', referrerId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    console.log('[GET /api/admin/partner-referrals] V2 - Referrals found:', referrals?.length, 'Error:', error);
    
    if (error) {
      console.error('Error fetching referrals:', error);
      return NextResponse.json({ error: 'Failed to fetch referrals', details: error }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      referrals: referrals || []
    });
  } catch (error) {
    console.error('[GET /api/admin/partner-referrals] V2 - Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
  }
}
