import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createTransferRecipient } from '@/lib/paystack-transfer';

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
      .select('id, name, display_name')
      .or(`clerk_user_id.eq.${userId},user_id.eq.${userId}`)
      .maybeSingle();

    if (authorErr || !author) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 });
    }

    // Fetch bank account details using actual columns in author_bank_accounts
    const { data: bankAccount, error } = await supabaseAdmin
      .from('author_bank_accounts')
      .select('id, author_id, bank_name, bank_code, account_number, account_name, recipient_code, created_at, updated_at')
      .eq('author_id', author.id)
      .maybeSingle();

    if (error || !bankAccount) {
      return NextResponse.json({
        success: true,
        bankAccount: null,
      });
    }

    const maskedNumber = bankAccount.account_number 
      ? '****' + bankAccount.account_number.slice(-4)
      : 'ENCRYPTED';

    return NextResponse.json({
      success: true,
      bankAccount: {
        id: bankAccount.id,
        bank_name: bankAccount.bank_name,
        bank_code: bankAccount.bank_code,
        routing_number: bankAccount.bank_code,
        account_number: maskedNumber,
        account_name: bankAccount.account_name,
        recipient_code: bankAccount.recipient_code,
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

    // Get author record
    const { data: author, error: authorErr } = await supabaseAdmin
      .from('authors')
      .select('id, name, display_name')
      .or(`clerk_user_id.eq.${userId},user_id.eq.${userId}`)
      .maybeSingle();

    if (authorErr || !author) {
      return NextResponse.json({ error: 'Author profile not found' }, { status: 404 });
    }

    const body = await req.json();
    const { bank_name, account_number, bank_code, account_name } = body;

    if (!bank_name || !account_number || !bank_code) {
      return NextResponse.json({ error: 'Please select a bank and enter your account number' }, { status: 400 });
    }

    const cleanAccountNumber = String(account_number).trim();
    const cleanBankCode = String(bank_code).trim();
    const cleanBankName = String(bank_name).trim();

    // Validate account number (Nigerian bank accounts are typically 8-12 digits)
    if (!/^\d{8,12}$/.test(cleanAccountNumber)) {
      return NextResponse.json({ error: 'Invalid account number. Must be 8-12 digits' }, { status: 400 });
    }

    // Validate bank code (3-6 digits, e.g. 044, 999992 for OPay)
    if (!/^\d{3,6}$/.test(cleanBankCode)) {
      return NextResponse.json({ error: 'Invalid bank code. Must be 3-6 digits' }, { status: 400 });
    }

    // Resolve account holder name
    const resolvedAccountName = (account_name || '').trim() || author.display_name || author.name || 'Author';

    // Attempt to create Paystack transfer recipient if configured
    let recipientCode: string | null = null;
    try {
      const recipient = await createTransferRecipient(
        cleanAccountNumber,
        cleanBankCode,
        resolvedAccountName
      );
      if (recipient?.recipient_code) {
        recipientCode = recipient.recipient_code;
      }
    } catch (paystackErr) {
      console.warn('[Bank PUT] Paystack recipient creation skipped/failed (non-fatal):', (paystackErr as Error).message);
    }

    // Check if an existing bank account record exists for this author
    const { data: existingAccount } = await supabaseAdmin
      .from('author_bank_accounts')
      .select('id')
      .eq('author_id', author.id)
      .maybeSingle();

    const now = new Date().toISOString();
    let saveError = null;
    let savedRecord = null;

    if (existingAccount) {
      const { data, error } = await supabaseAdmin
        .from('author_bank_accounts')
        .update({
          bank_name: cleanBankName,
          bank_code: cleanBankCode,
          account_number: cleanAccountNumber,
          account_name: resolvedAccountName,
          recipient_code: recipientCode || null,
          updated_at: now,
        })
        .eq('id', existingAccount.id)
        .select()
        .single();
      saveError = error;
      savedRecord = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from('author_bank_accounts')
        .insert({
          author_id: author.id,
          bank_name: cleanBankName,
          bank_code: cleanBankCode,
          account_number: cleanAccountNumber,
          account_name: resolvedAccountName,
          recipient_code: recipientCode || null,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();
      saveError = error;
      savedRecord = data;
    }

    if (saveError) {
      console.error('Bank account save error in Supabase:', saveError);
      return NextResponse.json({ error: 'Failed to save bank account: ' + saveError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Bank account saved successfully',
      bankAccount: {
        id: savedRecord?.id,
        bank_name: cleanBankName,
        bank_code: cleanBankCode,
        routing_number: cleanBankCode,
        account_name: resolvedAccountName,
        account_number: '****' + cleanAccountNumber.slice(-4),
        created_at: savedRecord?.created_at || now,
        updated_at: savedRecord?.updated_at || now,
      },
    });
  } catch (error) {
    console.error('Error saving bank details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
