import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get author ID from authenticated user
    const { data: author, error: authorErr } = await supabaseAdmin
      .from('authors')
      .select('id, clerk_user_id')
      .eq('clerk_user_id', userId)
      .single();

    if (authorErr || !author) {
      return NextResponse.json({ error: 'Author not found', details: authorErr?.message }, { status: 404 });
    }

    const authorId = author.id;

    // Check author_earnings table
    const { data: earnings, error: earningsError } = await supabaseAdmin
      .from('author_earnings')
      .select('*')
      .eq('author_id', authorId)
      .single();

    // Check author_sales table
    const { data: sales, error: salesError } = await supabaseAdmin
      .from('author_sales')
      .select('*')
      .eq('author_id', authorId);

    // Check author_transactions table
    const { data: transactions, error: transactionsError } = await supabaseAdmin
      .from('author_transactions')
      .select('*')
      .eq('author_id', authorId);

    // Check available balance via RPC
    let availableBalance = 0;
    let balanceError = null;
    try {
      const { data: balance } = await supabaseAdmin.rpc('available_balance', {
        p_author_id: authorId
      });
      availableBalance = balance || 0;
    } catch (e) {
      balanceError = (e as Error).message;
    }

    return NextResponse.json({
      success: true,
      author: {
        id: author.id,
        clerk_user_id: author.clerk_user_id
      },
      earnings: earnings || null,
      sales: sales || [],
      transactions: transactions || [],
      availableBalance,
      errors: {
        earnings: earningsError?.message,
        sales: salesError?.message,
        transactions: transactionsError?.message,
        balance: balanceError
      }
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
