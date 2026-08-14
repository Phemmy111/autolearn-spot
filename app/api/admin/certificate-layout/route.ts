import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin'

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    // Check if certificate_layout setting exists
    const { data: existing } = await supabaseAdmin
      .from('site_settings')
      .select('key')
      .eq('key', 'certificate_layout')
      .single();

    if (existing) {
      return NextResponse.json({ success: true, message: 'certificate_layout already exists' });
    }

    // Insert the setting with null value
    const { error } = await supabaseAdmin
      .from('site_settings')
      .insert({ key: 'certificate_layout', value: null });

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'certificate_layout initialized' });
  } catch (error) {
    console.error('Failed to initialize certificate_layout:', error);
    return NextResponse.json({ error: 'Failed to initialize certificate_layout' }, { status: 500 });
  }
}
