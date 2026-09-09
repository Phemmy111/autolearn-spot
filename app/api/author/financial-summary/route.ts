import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: author, error: authorErr } = await supabaseAdmin
    .from('authors')
    .select('id')
    .eq('user_id', userId)
    .single();
  if (authorErr || !author) return NextResponse.json({ error: 'Author not found' }, { status: 404 });
  const authorId = author.id;
  const { data: availableBalance, error: balErr } = await supabaseAdmin.rpc('available_balance', { p_author_id: authorId });
  const withdrawableAmount = availableBalance ?? 0;
  const { data: earnings, error: earnErr } = await supabaseAdmin
    .from('author_earnings')
    .select('total_gross,total_net')
    .eq('author_id', authorId)
    .single();
  const totalEarnings = earnings?.total_net ?? 0;
  const totalSales = earnings?.total_gross ?? 0;
  if (balErr || earnErr) {
    return NextResponse.json({ error: 'Failed to fetch financial data' }, { status: 500 });
  }
  return NextResponse.json({
    success: true,
    available_balance: availableBalance,
    withdrawable_amount: withdrawableAmount,
    total_earnings: totalEarnings,
    total_sales: totalSales,
  });
}
