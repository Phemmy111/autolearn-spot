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
      .select('id, display_name, clerk_user_id')
      .eq('clerk_user_id', userId)
      .single();

    if (authorErr || !author) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 });
    }

    // Check if the author exists by ID
    const { data: authorById, error: idError } = await supabaseAdmin
      .from('authors')
      .select('*')
      .eq('id', '8a07dde8-9200-4113-ab20-5adc7002e6f0')
      .single();

    return NextResponse.json({
      success: true,
      currentAuthor: author,
      targetAuthor: authorById,
      targetAuthorError: idError?.message
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
