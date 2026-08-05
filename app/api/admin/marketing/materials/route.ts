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
    
    // Transform data to match frontend expectations
    const transformedData = data?.map(item => ({
      id: item.id,
      name: item.resource_name,
      type: item.resource_type,
      category: item.category,
      description: item.description,
      file_url: item.resource_url,
      download_count: item.download_count,
      created_at: item.created_at
    })) || [];

    return NextResponse.json({ success: true, materials: transformedData });
  } catch (error) {
    console.error('[GET /api/admin/marketing/materials] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}