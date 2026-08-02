import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { requireAdmin } from '@/lib/admin';
import { WithdrawalService } from '@/lib/growth-engine/WithdrawalService';
import { logAuditEvent } from '@/lib/audit-logging';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { userId } = await auth();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const studentId = searchParams.get('userId') || undefined;

    const withdrawals = await WithdrawalService.listWithdrawals({ status, userId: studentId });

    // Fetch user profiles for names/emails
    const userIds = [...new Set(withdrawals.map(w => w.user_id))];
    const { data: profiles } = await supabaseAdmin
      .from('enrollments')
      .select('user_id, email, first_name, last_name')
      .in('user_id', userIds);
      
    const profileMap = new Map();
    if (profiles) {
      profiles.forEach(p => {
        if (!profileMap.has(p.user_id)) {
          profileMap.set(p.user_id, {
            email: p.email,
            name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown'
          });
        }
      });
    }

    const formattedWithdrawals = withdrawals.map(w => ({
      ...w,
      userEmail: profileMap.get(w.user_id)?.email || 'Unknown',
      userName: profileMap.get(w.user_id)?.name || 'Unknown'
    }));

    await logAuditEvent({
      event_type: 'admin_activity',
      event_category: 'status_change',
      event_action: 'admin_withdrawal_list_viewed',
      user_id: userId || undefined,
      resource_type: 'withdrawal',
      description: 'Admin viewed withdrawal list',
      metadata: { filters: Object.fromEntries(searchParams.entries()) }
    });

    return NextResponse.json({ success: true, withdrawals: formattedWithdrawals });
  } catch (error) {
    console.error('[GET /api/admin/withdrawals] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const { userId: adminId } = await auth();
    if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { action, withdrawalId, paymentReference, notes, reason } = body;

    if (!withdrawalId || !action) {
      return NextResponse.json({ error: 'Missing withdrawalId or action' }, { status: 400 });
    }

    let result;
    if (action === 'approve') {
      if (!paymentReference) return NextResponse.json({ error: 'Missing paymentReference' }, { status: 400 });
      result = await WithdrawalService.approveWithdrawal({
        withdrawalId,
        adminId,
        paymentReference,
        notes
      });
    } else if (action === 'reject') {
      if (!reason) return NextResponse.json({ error: 'Missing reason' }, { status: 400 });
      result = await WithdrawalService.rejectWithdrawal({
        withdrawalId,
        adminId,
        reason
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[POST /api/admin/withdrawals] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
