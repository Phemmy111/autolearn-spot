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
    const status = searchParams.get('status')?.toUpperCase();

    // 1. Fetch withdrawals from author_withdrawals
    let query = supabaseAdmin
      .from('author_withdrawals')
      .select('*')
      .order('created_at', { ascending: false });

    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    }

    const { data: rawWithdrawals, error: wdError } = await query;
    if (wdError) throw wdError;

    // 2. Fetch partners and bank profiles to resolve details
    const { data: allPartners } = await supabaseAdmin
      .from('partners')
      .select('id, partner_id, name, email, phone');

    const partnerMap = new Map<string, any>();
    (allPartners || []).forEach((p) => partnerMap.set(p.id, p));

    const { data: bankProfiles } = await supabaseAdmin
      .from('partner_bank_profiles')
      .select('*');

    const bankMap = new Map<string, any>();
    (bankProfiles || []).forEach((b) => bankMap.set(b.partner_id, b));

    // 3. Map into clean format
    const withdrawals = (rawWithdrawals || []).map((w) => {
      const partner = partnerMap.get(w.author_id);
      const bank = bankMap.get(w.author_id);

      return {
        id: w.id,
        amount: Number(w.amount) || 0,
        status: (w.status || 'PENDING').toLowerCase(),
        reference: w.reference || (w.id ? w.id.slice(0, 8) : 'WD-REF'),
        created_at: w.created_at,
        updated_at: w.updated_at,
        bank_name: bank?.bank_name || 'Bank Transfer',
        account_number: bank?.account_number || 'N/A',
        account_name: bank?.account_name || partner?.name || 'N/A',
        partners: {
          id: w.author_id,
          full_name: partner?.name || 'Partner / Author',
          email: partner?.email || 'N/A',
          partner_type: partner ? 'affiliate' : 'author',
        },
      };
    });

    return NextResponse.json({ success: true, withdrawals });
  } catch (error: any) {
    console.error('[GET /api/admin/partner-withdrawals] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { action, withdrawalId, paymentReference, reason } = body;

    if (!withdrawalId || !action) {
      return NextResponse.json(
        { error: 'Missing withdrawalId or action' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      const { error: updateError } = await supabaseAdmin
        .from('author_withdrawals')
        .update({
          status: 'PAID',
          reference: paymentReference || `PAID-${Date.now().toString(36).toUpperCase()}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', withdrawalId);

      if (updateError) throw updateError;
      return NextResponse.json({ success: true });
    } else if (action === 'reject') {
      const { error: updateError } = await supabaseAdmin
        .from('author_withdrawals')
        .update({
          status: 'REJECTED',
          updated_at: new Date().toISOString(),
        })
        .eq('id', withdrawalId);

      if (updateError) throw updateError;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('[POST /api/admin/partner-withdrawals] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
