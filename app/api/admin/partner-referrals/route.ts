import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('partnerId');

    if (!partnerId) {
      return NextResponse.json({ error: 'Partner ID required' }, { status: 400 });
    }

    // Resolve partner
    const { data: partner } = await supabaseAdmin
      .from('partners')
      .select('id, name, email')
      .or(`id.eq.${partnerId},partner_id.eq.${partnerId}`)
      .single();

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    // Fetch commissions / referral transactions
    const { data: commissions, error: commError } = await supabaseAdmin
      .from('commissions')
      .select('*')
      .eq('referrer_id', partner.id)
      .order('created_at', { ascending: false });

    if (commError) throw commError;

    // Fetch referral codes
    const { data: refCodes } = await supabaseAdmin
      .from('referral_codes')
      .select('*')
      .or(`owner_id.eq.${partner.id},partner_id.eq.${partner.id}`);

    return NextResponse.json({
      success: true,
      partner,
      referrals: commissions || [],
      referralCodes: refCodes || [],
    });
  } catch (error: any) {
    console.error('[GET /api/admin/partner-referrals] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
