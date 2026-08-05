import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }
    
    const { data, error } = await supabaseAdmin
      .from('partner_marketing_downloads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[GET /api/admin/marketing/materials] Error:', error);
      return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 });
    }

    return NextResponse.json({ success: true, materials: data });
  } catch (error) {
    console.error('[GET /api/admin/marketing/materials] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}