import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const enabledOnly = searchParams.get('enabled') === 'true';
    const featuredOnly = searchParams.get('featured') === 'true';

    let query = supabaseAdmin
      .from('testimonials')
      .select('*')
      .order('display_order', { ascending: true });

    if (enabledOnly) {
      query = query.eq('enabled', true);
    }

    if (featuredOnly) {
      query = query.eq('featured', true);
    }

    const { data: testimonials, error } = await query;

    if (error) throw error;

    return NextResponse.json({ success: true, testimonials: testimonials || [] });
  } catch (error) {
    console.error('[GET /api/content/testimonials] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}