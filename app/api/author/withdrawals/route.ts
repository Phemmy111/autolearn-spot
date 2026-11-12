import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { EmailService } from '@/lib/email-service';

export const dynamic = 'force-dynamic';

async function computeAvailableBalance(authorId: string): Promise<number> {
  const { data: transactions } = await supabaseAdmin
    .from('author_transactions')
    .select('type, amount')
    .eq('author_id', authorId);

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

  const { data: withdrawals } = await supabaseAdmin
    .from('author_withdrawals')
    .select('amount, status')
    .eq('author_id', authorId)
    .in('status', ['PENDING', 'PROCESSING', 'APPROVED', 'PAID']);

  let totalWithdrawalsAmount = 0;
  (withdrawals || []).forEach(w => {
    totalWithdrawalsAmount += Number(w.amount) || 0;
  });

  const totalDebits = Math.max(totalDebitsFromTx, totalWithdrawalsAmount);
  return Math.max(0, totalCredits - totalDebits);
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get author by clerk_user_id or user_id
    const { data: authors, error: authorErr } = await supabaseAdmin
      .from('authors')
      .select('id, display_name, email')
      .or(`clerk_user_id.eq.${userId},user_id.eq.${userId}`)
      .limit(1);

    if (authorErr || !authors || authors.length === 0) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 });
    }

    const author = authors[0];
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');

    let query = supabaseAdmin
      .from('author_withdrawals')
      .select('*', { count: 'exact' })
      .eq('author_id', author.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: withdrawals, error, count } = await query;

    if (error) {
      console.error('Error fetching withdrawals:', error);
      return NextResponse.json({ error: 'Failed to fetch withdrawals' }, { status: 500 });
    }

    // Map withdrawals for frontend compatibility
    const mapped = (withdrawals || []).map(w => ({
      id: w.id,
      amount: Number(w.amount) || 0,
      currency: 'NGN',
      status: w.status || 'PENDING',
      provider: 'PAYSTACK',
      provider_reference: w.reference || w.transfer_code || null,
      requested_at: w.created_at,
      created_at: w.created_at,
      updated_at: w.updated_at,
      processed_at: w.status === 'PAID' ? w.updated_at : null,
      failure_reason: null,
      admin_note: null,
    }));

    return NextResponse.json({
      success: true,
      withdrawals: mapped,
      total: count || mapped.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error in withdrawals GET API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get author
    const { data: authors, error: authorErr } = await supabaseAdmin
      .from('authors')
      .select('id, display_name, email')
      .or(`clerk_user_id.eq.${userId},user_id.eq.${userId}`)
      .limit(1);

    if (authorErr || !authors || authors.length === 0) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 });
    }

    const author = authors[0];
    const body = await req.json();
    const amount = Number(body?.amount);

    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Minimum withdrawal is ₦1,000
    const MIN_WITHDRAWAL = 1000;
    if (amount < MIN_WITHDRAWAL) {
      return NextResponse.json({
        error: `Minimum withdrawal is ₦${MIN_WITHDRAWAL.toLocaleString()}`
      }, { status: 400 });
    }

    // Check if author has a bank account registered
    const { data: bankAccount, error: bankError } = await supabaseAdmin
      .from('author_bank_accounts')
      .select('id, bank_name, account_number, account_name, bank_code, recipient_code')
      .eq('author_id', author.id)
      .maybeSingle();

    if (bankError || !bankAccount || !bankAccount.account_number) {
      return NextResponse.json({
        error: 'Please add and save your bank details in Bank Details before requesting a withdrawal'
      }, { status: 400 });
    }

    // Check available balance
    const availableBalance = await computeAvailableBalance(author.id);

    if (amount > availableBalance) {
      return NextResponse.json({
        error: `Insufficient balance. Available: ₦${availableBalance.toLocaleString()}, Requested: ₦${amount.toLocaleString()}`
      }, { status: 400 });
    }

    const now = new Date().toISOString();
    const reference = `WD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    // Insert withdrawal request using real schema columns
    const { data: withdrawal, error: withdrawalError } = await supabaseAdmin
      .from('author_withdrawals')
      .insert({
        author_id: author.id,
        amount,
        status: 'PENDING',
        reference,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (withdrawalError || !withdrawal) {
      console.error('Error creating withdrawal:', withdrawalError);
      return NextResponse.json({ error: 'Failed to create withdrawal request' }, { status: 500 });
    }

    // Insert withdrawal debit transaction
    const { error: txError } = await supabaseAdmin
      .from('author_transactions')
      .insert({
        author_id: author.id,
        type: 'WITHDRAWAL_DEBIT',
        amount,
        currency: 'NGN',
        related_id: withdrawal.id,
        description: `Withdrawal request ${reference}`,
        created_at: now,
      });

    if (txError) {
      console.warn('Warning: author_transaction creation error:', txError);
    }

    // Send notification to founder
    try {
      await EmailService.sendFounderWithdrawalNotification(
        author.display_name || 'Author',
        author.email || '',
        amount,
        reference
      );
    } catch (emailError) {
      console.warn('Failed to send withdrawal notification email:', emailError);
    }

    const responsePayload = {
      id: withdrawal.id,
      amount: Number(withdrawal.amount),
      currency: 'NGN',
      status: withdrawal.status,
      provider: 'PAYSTACK',
      provider_reference: withdrawal.reference,
      requested_at: withdrawal.created_at,
      created_at: withdrawal.created_at,
      updated_at: withdrawal.updated_at,
      processed_at: null,
      failure_reason: null,
      admin_note: null,
    };

    return NextResponse.json({
      success: true,
      withdrawal: responsePayload,
      message: 'Withdrawal request submitted successfully'
    });
  } catch (error) {
    console.error('Error in withdrawal POST API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
