import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET returns the current draft and published configurations.
 */
export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from('site_settings')
    .select('key, value')
    .in('key', ['design_studio_draft', 'design_studio_published']);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const draft = data.find((d) => d.key === 'design_studio_draft')?.value ?? null;
  const published = data.find((d) => d.key === 'design_studio_published')?.value ?? null;

  return NextResponse.json({ draft, published });
}

/**
 * POST expects JSON { action: 'save_draft' | 'publish', config: { backgroundColor, accentColor, buttonRadius, typography } }
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { action, config } = await request.json();
    if (!action || typeof config !== 'object') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    if (action === 'save_draft') {
      await supabaseAdmin.from('site_settings').upsert({ key: 'design_studio_draft', value: config }, { onConflict: 'key' });
      return NextResponse.json({ success: true, message: 'Draft saved' });
    }

    if (action === 'publish') {
      await supabaseAdmin.from('site_settings').upsert([
        { key: 'design_studio_draft', value: config },
        { key: 'design_studio_published', value: config },
      ], { onConflict: 'key' });
      return NextResponse.json({ success: true, message: 'Published successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
