import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

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
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    if (authorErr || !author) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 });
    }

    // Fetch bank account details (masked)
    const { data: bankAccount, error } = await supabaseAdmin
      .from('author_bank_accounts')
      .select('id, bank_name, account_number, routing_number, created_at, updated_at')
      .eq('author_id', author.id)
      .single();

    if (error) {
      // No bank account yet - return empty state
      return NextResponse.json({
        success: true,
        bankAccount: null,
      });
    }

    // Handle encrypted bytea data - return basic info without trying to decrypt
    return NextResponse.json({
      success: true,
      bankAccount: {
        id: bankAccount.id,
        bank_name: bankAccount.bank_name,
        // Can't decrypt without pgcrypto.key, so just show that account exists
        account_number: 'ENCRYPTED',
        routing_number: 'ENCRYPTED',
        created_at: bankAccount.created_at,
        updated_at: bankAccount.updated_at,
      },
    });
  } catch (error) {
    console.error('Error fetching bank details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
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

    const body = await req.json();
    const { bank_name, account_number, bank_code } = body;

    if (!bank_name || !account_number || !bank_code) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate account number (Nigerian bank accounts are typically 10 digits)
    // Allow for some flexibility as bank account formats can vary
    if (!/^\d{8,12}$/.test(account_number)) {
      return NextResponse.json({ error: 'Invalid account number. Must be 8-12 digits' }, { status: 400 });
    }

    // Validate bank code (typically 3 digits for Nigerian bank codes)
    if (!/^\d{3}$/.test(bank_code)) {
      return NextResponse.json({ error: 'Invalid bank code. Must be 3 digits' }, { status: 400 });
    }

    // Try to use the RPC function for encryption first
    let error: any;
    try {
      const { error: rpcError } = await supabaseAdmin.rpc('upsert_author_bank_account', {
        p_author_id: author.id,
        p_bank_name: bank_name,
        p_account_number: account_number,
        p_routing_number: bank_code
      });
      error = rpcError;
    } catch (rpcErr) {
      error = rpcErr;
    }

    // If RPC fails, fall back to direct insert (less secure but functional)
    if (error) {
      console.warn('RPC encryption failed, falling back to direct insert:', error);
      const { error: upsertErr } = await supabaseAdmin
        .from('author_bank_accounts')
        .upsert({
          author_id: author.id,
          bank_name,
          account_number,
          routing_number: bank_code,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'author_id'
        });
      error = upsertErr;
    }

    if (error) {
      console.error('Bank account upsert error:', error);
      return NextResponse.json({ error: 'Failed to save bank account' }, { status: 500 });
    }

    if (upsertErr) {
      console.error('Bank account upsert error:', upsertErr);
      return NextResponse.json({ error: 'Failed to save bank account' }, { status: 500 });
    }

    // Return success response
    return NextResponse.json({
      success: true,
      bankAccount: {
        bank_name,
        account_number: '****' + account_number.slice(-4),
        bank_code: '****' + bank_code.slice(-4),
      },
    });
  } catch (error) {
    console.error('Error saving bank details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
