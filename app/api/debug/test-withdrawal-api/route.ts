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
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    if (authorErr || !author) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 });
    }

    // Test 1: Check bank account
    const { data: bankAccount, error: bankError } = await supabaseAdmin
      .from('author_bank_accounts')
      .select('*')
      .eq('author_id', author.id)
      .maybeSingle();

    // Test 2: Check available balance RPC
    const { data: balance, error: balanceError } = await supabaseAdmin.rpc('available_balance', {
      p_author_id: author.id
    });

    // Test 3: Check author_withdrawals table
    const { data: withdrawals, error: withdrawalsError } = await supabaseAdmin
      .from('author_withdrawals')
      .select('*')
      .eq('author_id', author.id)
      .limit(5);

    return NextResponse.json({
      success: true,
      authorId: author.id,
      tests: {
        bankAccount: {
          data: bankAccount,
          error: bankError?.message
        },
        balance: {
          data: balance,
          error: balanceError?.message
        },
        withdrawals: {
          data: withdrawals,
          error: withdrawalsError?.message
        }
      }
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
