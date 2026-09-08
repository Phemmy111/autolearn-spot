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
    const { amount } = body;

    if (amount === undefined) {
      return NextResponse.json({ error: 'Missing amount' }, { status: 400 });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Look up authorId based on Clerk userId
    const { supabaseAdmin } = await import('@/lib/supabase');
    const { data: author, error: authorErr } = await supabaseAdmin
      .from('authors')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (authorErr || !author) {
      return NextResponse.json({ error: 'Author profile not found' }, { status: 403 });
    }

    // Generate deterministic request_ref (UUID)
    const requestRef = crypto.randomUUID();

    // Use authorService requestWithdrawal RPC
    const { requestWithdrawal } = await import('@/lib/authorService');
    const withdrawal = await requestWithdrawal(author.id, numAmount, requestRef);

    return NextResponse.json({ success: true, withdrawal });
  } catch (error: any) {
    console.error('[POST /api/withdrawals] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 400 });
  }
}
