import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

function parseConfigValue(val: any) {
  if (!val) return null;
  if (typeof val === 'object') {
    // If it's already an object, clean out any numeric string keys
    const clean: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (!/^\d+$/.test(k)) {
        clean[k] = v;
      }
    }
    return clean;
  }
  if (typeof val === 'string') {
    try {
      let parsed = JSON.parse(val);
      if (typeof parsed === 'string') {
        parsed = JSON.parse(parsed);
      }
      if (parsed && typeof parsed === 'object') {
        const clean: Record<string, any> = {};
        for (const [k, v] of Object.entries(parsed)) {
          if (!/^\d+$/.test(k)) {
            clean[k] = v;
          }
        }
        return clean;
      }
      return parsed;
    } catch {
      return null;
    }
  }
  return null;
}

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

  const rawDraft = data?.find((d) => d.key === 'design_studio_draft')?.value ?? null;
  const rawPublished = data?.find((d) => d.key === 'design_studio_published')?.value ?? null;

  const draft = parseConfigValue(rawDraft);
  const published = parseConfigValue(rawPublished);

  return NextResponse.json({ draft, published });
}

/**
 * POST expects JSON { action: 'save_draft' | 'publish', config: { ... } }
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

    // Sanitize config to only valid properties
    const cleanConfig = {
      primaryColor: config.primaryColor || '#00f0ff',
      secondaryColor: config.secondaryColor || '#8b5cf6',
      accentColor: config.accentColor || '#00f0ff',
      backgroundColor: config.backgroundColor || '#f8f9fa',
      textColor: config.textColor || '#1a1a2e',
      linkColor: config.linkColor || '#00f0ff',
      borderColor: config.borderColor || '#e2e8f0',
      buttonRadius: config.buttonRadius !== undefined ? Number(config.buttonRadius) : 8,
      typography: config.typography || 'Inter',
      headingFont: config.headingFont || 'Space Grotesk',
      logoUrl: config.logoUrl || '',
      faviconUrl: config.faviconUrl || '',
    };

    const serialized = JSON.stringify(cleanConfig);

    if (action === 'save_draft') {
      await supabaseAdmin.from('site_settings').upsert({ 
        key: 'design_studio_draft', 
        value: serialized 
      }, { onConflict: 'key' });

      return NextResponse.json({ success: true, message: 'Draft saved', config: cleanConfig });
    }

    if (action === 'publish') {
      await supabaseAdmin.from('site_settings').upsert([
        { key: 'design_studio_draft', value: serialized },
        { key: 'design_studio_published', value: serialized },
        { key: 'primary_color', value: cleanConfig.primaryColor },
        { key: 'secondary_color', value: cleanConfig.secondaryColor },
        { key: 'accent_color', value: cleanConfig.accentColor },
      ], { onConflict: 'key' });

      return NextResponse.json({ success: true, message: 'Published successfully', config: cleanConfig });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('Error saving design studio config:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
