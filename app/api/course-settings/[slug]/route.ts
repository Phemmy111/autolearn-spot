import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';

// Helper to construct setting keys
const finalLessonKey = (slug: string) => `final_lesson_id:${slug}`;
const certEnabledKey = (slug: string) => `certificate_enabled:${slug}`;

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    // Fetch final lesson id
    const { data: finalData, error: finalErr } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', finalLessonKey(slug))
      .single();

    // Fetch certificate enabled flag (fallback to global key if per‑course missing)
    const { data: certData, error: certErr } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', certEnabledKey(slug))
      .single();

    const response = {
      finalLessonId: finalData?.value ?? null,
      certificateEnabled:
        certData?.value ??
        (await supabaseAdmin
          .from('site_settings')
          .select('value')
          .eq('key', 'certificate_enabled')
          .single()).data?.value ??
        false,
    };

    return NextResponse.json(response);
  } catch (e) {
    console.error('Error fetching course settings', e);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    await requireSuperAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { finalLessonId, certificateEnabled } = await request.json();
    const updates = [] as { key: string; value: any }[];
    if (typeof finalLessonId !== 'undefined') {
      updates.push({ key: finalLessonKey(slug), value: finalLessonId });
    }
    if (typeof certificateEnabled !== 'undefined') {
      updates.push({ key: certEnabledKey(slug), value: certificateEnabled });
    }
    if (updates.length === 0) {
      return NextResponse.json({ error: 'No settings provided' }, { status: 400 });
    }
    const { error } = await supabaseAdmin.from('site_settings').upsert(updates, { onConflict: 'key' });
    if (error) {
      console.error('Upsert error', error);
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('PUT error', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
