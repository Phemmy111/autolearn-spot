import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    const { data: withdrawals, error } = await supabaseAdmin
      .from('partner_withdrawals')
      .select(`
        *,
        partners (
          id,
          full_name,
          email,
          partner_type
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[GET /api/admin/partner-withdrawals] Error:', error);
      return NextResponse.json({ error: 'Failed to fetch withdrawals' }, { status: 500 });
    }

    return NextResponse.json({ success: true, withdrawals: withdrawals || [] });
  } catch (error) {
    console.error('[GET /api/admin/partner-withdrawals] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const { userId: adminId } = await auth();
    if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { action, withdrawalId, paymentReference, reason } = body;

    if (!withdrawalId || !action) {
      return NextResponse.json({ error: 'Missing withdrawalId or action' }, { status: 400 });
    }

    if (action === 'approve') {
      if (!paymentReference) return NextResponse.json({ error: 'Missing paymentReference' }, { status: 400 });

      const { error: updateError } = await supabaseAdmin
        .from('partner_withdrawals')
        .update({
          status: 'approved',
          approved_by: adminId,
          approved_at: new Date().toISOString(),
          payment_reference: paymentReference
        })
        .eq('id', withdrawalId);

      if (updateError) {
        console.error('[POST /api/admin/partner-withdrawals] Approval error:', updateError);
        return NextResponse.json({ error: 'Failed to approve withdrawal' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    } else if (action === 'reject') {
      if (!reason) return NextResponse.json({ error: 'Missing reason' }, { status: 400 });

      // Get withdrawal details first
      const { data: withdrawal } = await supabaseAdmin
        .from('partner_withdrawals')
        .select('*')
        .eq('id', withdrawalId)
        .single();

      if (!withdrawal) {
        return NextResponse.json({ error: 'Withdrawal not found' }, { status: 404 });
      }

      // Reject and refund
      const { error: updateError } = await supabaseAdmin
        .from('partner_withdrawals')
        .update({
          status: 'rejected',
          approved_by: adminId,
          rejection_reason: reason
        })
        .eq('id', withdrawalId);

      if (updateError) {
        console.error('[POST /api/admin/partner-withdrawals] Rejection error:', updateError);
        return NextResponse.json({ error: 'Failed to reject withdrawal' }, { status: 500 });
      }

      // Refund amount to partner's available earnings
      await supabaseAdmin
        .from('partners')
        .update({
          available_earnings: (await supabaseAdmin.from('partners').select('available_earnings').eq('id', withdrawal.partner_id).single()).data?.available_earnings || 0 + withdrawal.amount
        })
        .eq('id', withdrawal.partner_id);

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('[POST /api/admin/partner-withdrawals] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}