import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const enabledOnly = searchParams.get('enabled') === 'true';

    let query = supabaseAdmin
      .from('workflow_showcase')
      .select('*')
      .order('display_order', { ascending: true });

    if (enabledOnly) {
      query = query.eq('enabled', true);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, items: data || [] });
  } catch (error) {
    console.error('[GET /api/content/workflow-showcase] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}