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
      .select('id, bank_name, account_number, routing_number, account_number_text, routing_number_text, created_at, updated_at')
      .eq('author_id', author.id)
      .single();

    if (error) {
      // No bank account yet - return empty state
      return NextResponse.json({
        success: true,
        bankAccount: null,
      });
    }

    // Handle encrypted bytea data - use text columns if available
    let accountNumber = 'ENCRYPTED';
    let bankCode = 'ENCRYPTED';
    
    // Try to use text columns first (for transfer support)
    if (bankAccount.account_number_text) {
      accountNumber = '****' + bankAccount.account_number_text.slice(-4);
    }
    if (bankAccount.routing_number_text) {
      bankCode = '****' + bankAccount.routing_number_text.slice(-4);
    }
    
    return NextResponse.json({
      success: true,
      bankAccount: {
        id: bankAccount.id,
        bank_name: bankAccount.bank_name,
        account_number: accountNumber,
        bank_code: bankCode,
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

    // Validate bank code (3-6 digits for Nigerian bank codes, including fintech like Opay)
    if (!/^\d{3,6}$/.test(bank_code)) {
      return NextResponse.json({ error: 'Invalid bank code. Must be 3-6 digits (e.g., 044 for Access Bank, 999992 for Opay)' }, { status: 400 });
    }

    // Save to both encrypted and text columns for transfer support
    const { error: upsertErr } = await supabaseAdmin
      .from('author_bank_accounts')
      .upsert({
        author_id: author.id,
        bank_name,
        account_number_text: account_number,
        routing_number_text: bank_code,
        // Also try to save to encrypted columns for RPC support
        account_number: account_number,
        routing_number: bank_code,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'author_id'
      });

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
