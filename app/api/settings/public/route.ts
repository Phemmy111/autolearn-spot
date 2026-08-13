import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const keys = searchParams.get('keys');

    let query = supabaseAdmin.from('site_settings').select('key, value');

    if (keys) {
      const keyArray = keys.split(',');
      query = query.in('key', keyArray);
    }

    const { data: settings, error } = await query;

    if (error) throw error;

    const result: Record<string, string> = {};
    if (settings) {
      for (const setting of settings) {
        // Handle JSONB values - unwrap if stored as JSON string
        let value = setting.value;
        if (typeof value === 'string') {
          try {
            const parsed = JSON.parse(value);
            if (typeof parsed === 'string') {
              value = parsed;
            }
          } catch {
            // Not JSON, keep as is
          }
        }
        result[setting.key] = value;
      }
    }

    return NextResponse.json({ success: true, settings: result });
  } catch (error) {
    console.error('[GET /api/settings/public] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}