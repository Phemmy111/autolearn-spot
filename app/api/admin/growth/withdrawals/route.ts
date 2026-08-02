import { NextResponse } from 'next/server';
import { WithdrawalService } from '@/lib/growth-engine/WithdrawalService';
import { currentUser } from '@clerk/nextjs/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    
    const withdrawals = await WithdrawalService.listWithdrawals({ status });
    return NextResponse.json({ success: true, withdrawals });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user || user.publicMetadata.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, action, paymentReference, reason } = await request.json();
    if (!id || !action) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

    if (action === 'approve') {
      if (!paymentReference) return NextResponse.json({ error: 'Payment reference required' }, { status: 400 });
      const result = await WithdrawalService.approveWithdrawal({
        withdrawalId: id,
        adminId: user.id,
        paymentReference
      });
      if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json({ success: true });
    } else if (action === 'reject') {
      if (!reason) return NextResponse.json({ error: 'Rejection reason required' }, { status: 400 });
      const result = await WithdrawalService.rejectWithdrawal({
        withdrawalId: id,
        adminId: user.id,
        reason
      });
      if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
