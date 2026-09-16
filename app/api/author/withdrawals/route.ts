import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { EmailService } from '@/lib/email-service';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get author ID from authenticated user
    const { data: author, error: authorErr } = await supabaseAdmin
      .from('authors')
      .select('id, display_name, email')
      .eq('clerk_user_id', userId)
      .single();

    if (authorErr || !author) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');

    // Build query
    let query = supabaseAdmin
      .from('author_withdrawals')
      .select('*')
      .eq('author_id', author.id)
      .order('requested_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by status if specified
    if (status) {
      query = query.eq('status', status);
    }

    const { data: withdrawals, error } = await query;

    if (error) {
      console.error('Error fetching withdrawals:', error);
      return NextResponse.json({ error: 'Failed to fetch withdrawals' }, { status: 500 });
    }

    // Get total count for pagination
    const { count, error: countError } = await supabaseAdmin
      .from('author_withdrawals')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', author.id);

    if (countError) {
      console.error('Error counting withdrawals:', countError);
    }

    return NextResponse.json({
      success: true,
      withdrawals: withdrawals || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error in withdrawals API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get author ID from authenticated user
    const { data: author, error: authorErr } = await supabaseAdmin
      .from('authors')
      .select('id, display_name, email')
      .eq('clerk_user_id', userId)
      .single();

    if (authorErr || !author) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 });
    }

    const body = await req.json();
    const { amount } = body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Check if author has a bank account
    const { data: bankAccount, error: bankError } = await supabaseAdmin
      .from('author_bank_accounts')
      .select('id, bank_name')
      .eq('author_id', author.id)
      .maybeSingle();

    if (bankError || !bankAccount) {
      return NextResponse.json({ error: 'Please add a bank account before requesting a withdrawal' }, { status: 400 });
    }

    // Get available balance
    const { data: balance, error: balanceError } = await supabaseAdmin.rpc('available_balance', {
      p_author_id: author.id
    });

    if (balanceError || balance === null) {
      return NextResponse.json({ error: 'Failed to check available balance' }, { status: 500 });
    }

    const availableBalance = Number(balance);

    // Validate amount against available balance
    if (amount > availableBalance) {
      return NextResponse.json({ 
        error: `Insufficient balance. Available: ₦${availableBalance.toLocaleString()}, Requested: ₦${amount.toLocaleString()}` 
      }, { status: 400 });
    }

    // Check for minimum withdrawal (₦1,000)
    const MIN_WITHDRAWAL = 1000;
    if (amount < MIN_WITHDRAWAL) {
      return NextResponse.json({ 
        error: `Minimum withdrawal is ₦${MIN_WITHDRAWAL.toLocaleString()}` 
      }, { status: 400 });
    }

    // Insert withdrawal request
    const { data: withdrawal, error: withdrawalError } = await supabaseAdmin
      .from('author_withdrawals')
      .insert({
        author_id: author.id,
        amount,
        currency: 'NGN',
        status: 'PENDING',
        provider: 'PAYSTACK',
        provider_reference: null,
        requested_at: new Date().toISOString(),
        request_ref: crypto.randomUUID()
      })
      .select()
      .single();

    if (withdrawalError) {
      console.error('Error creating withdrawal:', withdrawalError);
      return NextResponse.json({ error: 'Failed to create withdrawal request' }, { status: 500 });
    }

    // Insert withdrawal debit transaction
    const { error: transactionError } = await supabaseAdmin
      .from('author_transactions')
      .insert({
        author_id: author.id,
        type: 'WITHDRAWAL_DEBIT',
        amount,
        currency: 'NGN',
        related_id: withdrawal.id,
        description: `Withdrawal request ${withdrawal.id}`
      });

    if (transactionError) {
      console.error('Error creating withdrawal transaction:', transactionError);
      // Don't fail the withdrawal if transaction creation fails
    }

    // Send notification to founder about withdrawal request
    try {
      await EmailService.sendFounderWithdrawalNotification(
        author.display_name,
        author.email,
        amount,
        withdrawal.id
      );
    } catch (emailError) {
      console.error('Failed to send withdrawal notification:', emailError);
      // Don't fail the withdrawal if email fails
    }

    return NextResponse.json({
      success: true,
      withdrawal,
      message: 'Withdrawal request submitted successfully'
    });
  } catch (error) {
    console.error('Error in withdrawal request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
