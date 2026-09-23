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
      .single();
    if (error) {
      console.error('Error fetching design studio config:', error);
      // Return empty config instead of error to prevent app from breaking
      return NextResponse.json({ config: {} });
    }
    const config = data?.value ?? {};
    return NextResponse.json({ config });
  } catch (err) {
    console.error('Unexpected error:', err);
    // Return empty config instead of error to prevent app from breaking
    return NextResponse.json({ config: {} });
  }
}
