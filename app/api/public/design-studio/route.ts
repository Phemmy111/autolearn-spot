// app/api/public/design-studio/route.ts
export const dynamic = 'force-dynamic';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', 'design_studio_published')
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ config: {} });
    }

    let config = data.value;
    if (typeof config === 'string') {
      try {
        config = JSON.parse(config);
        if (typeof config === 'string') {
          config = JSON.parse(config);
        }
      } catch (e) {
        config = {};
      }
    }

    return NextResponse.json({ config: config || {} });
  } catch (err) {
    console.error('Unexpected error fetching design config:', err);
    return NextResponse.json({ config: {} });
  }
}
