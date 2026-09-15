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

    // Mask the account number and bank code - show only last 4 digits
    // Handle both encrypted (bytea) and plain text storage
    let accountNumberStr = '';
    let bankCodeStr = '';
    
    if (typeof bankAccount.account_number === 'string') {
      accountNumberStr = bankAccount.account_number;
    }
    if (typeof bankAccount.routing_number === 'string') {
      bankCodeStr = bankAccount.routing_number;
    }
    
    return NextResponse.json({
      success: true,
      bankAccount: {
        id: bankAccount.id,
        bank_name: bankAccount.bank_name,
        // Mask the account number - show only last 4 digits
        account_number: '****' + accountNumberStr.slice(-4),
        // Mask bank code
        bank_code: '****' + routingNumberStr.slice(-4),
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

    // For now, use direct upsert without encryption since pgcrypto.key may not be configured
    // In production, you should configure pgcrypto.key and use the RPC function
    const { error: upsertErr } = await supabaseAdmin
      .from('author_bank_accounts')
      .upsert({
        author_id: author.id,
        bank_name,
        account_number, // Note: This should be encrypted in production
        routing_number: bank_code, // Note: This should be encrypted in production
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'author_id'
      });

    if (upsertErr) {
      console.error('Bank account upsert error:', upsertErr);
      return NextResponse.json({ error: 'Failed to save bank account' }, { status: 500 });
    }

    // Return a masked representation - only last 4 digits are exposed
    const maskedAccount = '****' + account_number.slice(-4);
    const maskedBankCode = '****' + bank_code.slice(-4);

    return NextResponse.json({
      success: true,
      bankAccount: {
        bank_name,
        account_number: maskedAccount,
        bank_code: maskedBankCode,
      },
    });
  } catch (error) {
    console.error('Error saving bank details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
