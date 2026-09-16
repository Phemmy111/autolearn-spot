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

    // Check if author_bank_accounts table exists and has data
    const { data: bankAccount, error: bankError } = await supabaseAdmin
      .from('author_bank_accounts')
      .select('*')
      .eq('author_id', author.id)
      .maybeSingle();

    // Check table structure
    const { data: tableInfo } = await supabaseAdmin
      .rpc('get_table_structure', { table_name: 'author_bank_accounts' });

    return NextResponse.json({
      success: true,
      authorId: author.id,
      bankAccount: bankAccount || null,
      bankError: bankError?.message,
      tableInfo: tableInfo || null
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
