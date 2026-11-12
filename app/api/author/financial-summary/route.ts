import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Look up author by clerk_user_id or user_id
    const { data: authors, error: authorErr } = await supabaseAdmin
      .from('authors')
      .select('id, clerk_user_id, user_id, display_name, email')
      .or(`clerk_user_id.eq.${userId},user_id.eq.${userId}`)
      .limit(1);

    if (authorErr || !authors || authors.length === 0) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 });
    }

    const author = authors[0];
    const authorId = author.id;

    // 1. Calculate credits from author_transactions
    const { data: transactions, error: txErr } = await supabaseAdmin
      .from('author_transactions')
      .select('type, amount')
      .eq('author_id', authorId);

    if (txErr) {
      console.error('Error fetching author transactions:', txErr);
    }

    let totalCredits = 0;
    let totalDebitsFromTx = 0;

    (transactions || []).forEach(tx => {
      const amt = Number(tx.amount) || 0;
      const type = (tx.type || '').toUpperCase();
      if (type === 'SALE_CREDIT' || type === 'CREDIT') {
        totalCredits += amt;
      } else if (type === 'WITHDRAWAL_DEBIT' || type === 'DEBIT') {
        totalDebitsFromTx += amt;
      }
    });

    // 2. Fetch pending or processing withdrawals to ensure debits reflect active requests
    const { data: withdrawals, error: wdErr } = await supabaseAdmin
      .from('author_withdrawals')
      .select('amount, status')
      .eq('author_id', authorId)
      .in('status', ['PENDING', 'PROCESSING', 'APPROVED', 'PAID']);

    if (wdErr) {
      console.error('Error fetching author withdrawals for balance:', wdErr);
    }

    let totalWithdrawalsAmount = 0;
    (withdrawals || []).forEach(w => {
      totalWithdrawalsAmount += Number(w.amount) || 0;
    });

    // Effective debit is max between ledger debits and active withdrawals
    const totalDebits = Math.max(totalDebitsFromTx, totalWithdrawalsAmount);
    const availableBalance = Math.max(0, totalCredits - totalDebits);

    // 3. Calculate gross sales and net earnings from author_sales
    const { data: sales, error: salesErr } = await supabaseAdmin
      .from('author_sales')
      .select('gross_amount, net_amount, commission_amount')
      .eq('author_id', authorId);

    if (salesErr) {
      console.error('Error fetching author sales:', salesErr);
    }

    let totalSales = 0;
    let totalEarnings = 0;
    let totalCommission = 0;

    (sales || []).forEach(s => {
      totalSales += Number(s.gross_amount) || 0;
      totalEarnings += Number(s.net_amount) || 0;
      totalCommission += Number(s.commission_amount) || 0;
    });

    // Fallback if no sales rows yet but transactions exist
    if (totalEarnings === 0 && totalCredits > 0) {
      totalEarnings = totalCredits;
      totalSales = Math.round(totalCredits / 0.9);
      totalCommission = totalSales - totalEarnings;
    }

    return NextResponse.json({
      success: true,
      available_balance: availableBalance,
      withdrawable_amount: availableBalance,
      total_earnings: totalEarnings,
      total_sales: totalSales,
      total_commission: totalCommission,
    });
  } catch (error: any) {
    console.error('Financial summary error:', error);
    return NextResponse.json({ error: 'Failed to fetch financial data' }, { status: 500 });
  }
}
