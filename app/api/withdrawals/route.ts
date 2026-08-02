import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { WithdrawalService } from '@/lib/growth-engine/WithdrawalService';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const withdrawals = await WithdrawalService.getUserWithdrawals(userId);
    return NextResponse.json({ success: true, withdrawals });
  } catch (error) {
    console.error('[GET /api/withdrawals] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, bankName, accountNumber, accountName } = body;

    if (!amount || !bankName || !accountNumber || !accountName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const result = await WithdrawalService.submitWithdrawal({
      userId,
      amount: numAmount,
      bankName,
      accountNumber,
      accountName
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, withdrawal: result.withdrawal });
  } catch (error) {
    console.error('[POST /api/withdrawals] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
