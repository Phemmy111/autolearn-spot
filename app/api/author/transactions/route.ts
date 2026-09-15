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

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const type = searchParams.get('type');

    // Build query
    let query = supabaseAdmin
      .from('author_transactions')
      .select('*')
      .eq('author_id', author.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by type if specified
    if (type) {
      query = query.eq('type', type);
    }

    const { data: transactions, error } = await query;

    if (error) {
      console.error('Error fetching transactions:', error);
      return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }

    // Get total count for pagination
    const { count, error: countError } = await supabaseAdmin
      .from('author_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', author.id);

    if (countError) {
      console.error('Error counting transactions:', countError);
    }

    return NextResponse.json({
      success: true,
      transactions: transactions || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error in transactions API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
