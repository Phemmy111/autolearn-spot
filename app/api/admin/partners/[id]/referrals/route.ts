import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }
    
    const partnerId = params.id;
    
    // Get partner type to determine referrer_id
    const { data: partner } = await supabaseAdmin
      .from('partners')
      .select('partner_type, clerk_user_id')
      .eq('id', partnerId)
      .single();
    
    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }
    
    // For student partners, use clerk_user_id as referrer_id
    // For community/influencer partners, use partner.id
    const referrerId = partner.partner_type === 'student' ? partner.clerk_user_id : partnerId;
    
    console.log('[GET /api/admin/partners/[id]/referrals] Partner:', partnerId, 'Type:', partner.partner_type, 'Referrer ID:', referrerId);
    
    // Fetch recent referrals for this partner
    const { data: referrals, error } = await supabaseAdmin
      .from('commissions')
      .select('*')
      .eq('referrer_id', referrerId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    console.log('[GET /api/admin/partners/[id]/referrals] Referrals found:', referrals?.length);
    
    if (error) {
      console.error('Error fetching referrals:', error);
      return NextResponse.json({ error: 'Failed to fetch referrals' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      referrals: referrals || []
    });
  } catch (error) {
    console.error('[GET /api/admin/partners/[id]/referrals] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}