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
    const { data, error } = await supabaseAdmin
      .from('partners')
      .select(`
        *,
        referral_codes(code)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, partners: data });
  } catch (error) {
    console.error('[GET /api/admin/partners] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
