import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { WithdrawalService } from '@/lib/growth-engine/WithdrawalService';
import { PartnerEmailService } from '@/lib/growth-engine/PartnerEmailService';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;

    const withdrawals = await WithdrawalService.listWithdrawals({ status });

    return NextResponse.json({ success: true, withdrawals });
  } catch (error) {
    console.error('[GET /api/admin/growth-center/withdrawals] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const { userId: adminId } = await auth();
    if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { withdrawalId, action, paymentReference, reason } = await request.json();

    if (!withdrawalId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (action === 'approve') {
      if (!paymentReference) {
        return NextResponse.json({ error: 'Payment reference is required' }, { status: 400 });
      }

      const result = await WithdrawalService.approveWithdrawal({
        withdrawalId,
        adminId,
        paymentReference
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      // Email is already sent in WithdrawalService
      return NextResponse.json({ success: true });
    }

    if (action === 'reject') {
      if (!reason) {
        return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
      }

      const result = await WithdrawalService.rejectWithdrawal({
        withdrawalId,
        adminId,
        reason
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('[POST /api/admin/growth-center/withdrawals] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}