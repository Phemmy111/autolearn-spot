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
    
    console.log('[GET /api/admin/partners/[id]/details] Fetching for partner ID:', partnerId);
    
    // Fetch bank details
    const { data: bankDetails, error: bankError } = await supabaseAdmin
      .from('partner_bank_profiles')
      .select('*')
      .eq('partner_id', partnerId)
      .single();
    
    console.log('[GET /api/admin/partners/[id]/details] Bank details result:', bankDetails, bankError);
    
    if (bankError && bankError.code !== 'PGRST116') {
      console.error('Error fetching bank details:', bankError);
    }
    
    // Fetch partner info
    const { data: partner, error: partnerError } = await supabaseAdmin
      .from('partners')
      .select('*')
      .eq('id', partnerId)
      .single();
    
    console.log('[GET /api/admin/partners/[id]/details] Partner result:', partner, partnerError);
    
    return NextResponse.json({
      success: true,
      bankDetails: bankDetails,
      partner: partner
    });
  } catch (error) {
    console.error('[GET /api/admin/partners/[id]/details] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}