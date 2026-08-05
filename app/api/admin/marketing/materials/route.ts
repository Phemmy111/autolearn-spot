import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    console.log('[GET /api/admin/marketing/materials] Starting request');
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      console.log('[GET /api/admin/marketing/materials] Unauthorized access');
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }
    
    console.log('[GET /api/admin/marketing/materials] Fetching materials from database');
    const { data, error } = await supabaseAdmin
      .from('partner_marketing_downloads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[GET /api/admin/marketing/materials] Database error:', error);
      console.error('[GET /api/admin/marketing/materials] Error code:', error.code);
      console.error('[GET /api/admin/marketing/materials] Error message:', error.message);
      return NextResponse.json({ error: 'Failed to fetch materials', details: error.message }, { status: 500 });
    }

    console.log('[GET /api/admin/marketing/materials] Successfully fetched materials:', data?.length || 0);
    return NextResponse.json({ success: true, materials: data });
  } catch (error) {
    console.error('[GET /api/admin/marketing/materials] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}