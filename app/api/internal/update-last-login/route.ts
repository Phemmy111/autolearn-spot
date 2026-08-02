import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const { table, userId } = await request.json();

    if (!table || !userId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    if (table !== 'community_ambassadors' && table !== 'influencers') {
      return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from(table)
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.error('[POST /api/internal/update-last-login] Error:', error);
      return NextResponse.json({ error: 'Failed to update last login' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[POST /api/internal/update-last-login] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}