// app/api/authors/[authorId]/bank-profile/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * POST /api/authors/:authorId/bank-profile
 * Allows an author to create or update their payout bank account.
 * Only the owner (matched via Clerk userId) may perform the operation.
 * The response returns masked account details – never the plaintext values.
 */
export async function POST(request: Request, { params }: { params: { authorId: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve the author record belonging to this Clerk user
    const { data: author, error: authorErr } = await supabaseAdmin
      .from('authors')
      .select('id')
      .eq('user_id', userId)
      .single();
    if (authorErr || !author) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Enforce ownership – the path param must match the resolved author id
    if (author.id !== params.authorId) {
      return NextResponse.json({ error: "Forbidden: cannot manage another author's bank account" }, { status: 403 });
    }

    const body = await request.json();
    const { bank_name, account_number, routing_number } = body;
    if (!bank_name || !account_number || !routing_number) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Call the RPC that performs the upsert with column‑level encryption
    const { error: rpcErr } = await supabaseAdmin.rpc('upsert_author_bank_account', {
      p_author_id: params.authorId,
      p_bank_name: bank_name,
      p_account_number: account_number,
      p_routing_number: routing_number,
    });
    if (rpcErr) {
      console.error('upsert_author_bank_account RPC error:', rpcErr);
      return NextResponse.json({ error: 'Failed to upsert bank account' }, { status: 500 });
    }

    // Return a masked representation – only last 4 digits are exposed
    const maskedAccount = '****' + account_number.slice(-4);
    const maskedRouting = '****' + routing_number.slice(-4);

    return NextResponse.json({
      success: true,
      bank_name,
      account_number: maskedAccount,
      routing_number: maskedRouting,
    });
  } catch (e) {
    console.error('[POST /api/authors/:authorId/bank-profile] error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
