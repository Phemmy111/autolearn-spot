import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || undefined;

    let query = supabaseAdmin
      .from('ambassadors')
      .select('*')
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('ambassador_type', type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[GET /api/admin/ambassadors] DB Error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ success: true, ambassadors: data });
  } catch (error) {
    console.error('[GET /api/admin/ambassadors] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
