// app/api/admin/settings/commission/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';
import { logAdminAction } from '@/lib/auditLog';

export const dynamic = 'force-dynamic';

const SETTING_KEY = 'platform_commission_rate';
const DEFAULT_RATE = 10; // 10%

/**
 * GET /api/admin/settings/commission
 * Returns the current platform commission rate (percentage, 0-100).
 */
export async function GET() {
  try {
    await requireAdmin();
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', SETTING_KEY)
      .single();

    if (error || !data) {
      return NextResponse.json({ commission_rate: DEFAULT_RATE });
    }

    let rate = DEFAULT_RATE;
    try {
      const parsed = JSON.parse(data.value);
      rate = typeof parsed === 'number' ? parsed : parseFloat(parsed);
    } catch {
      rate = parseFloat(data.value) ?? DEFAULT_RATE;
    }

    return NextResponse.json({ commission_rate: isNaN(rate) ? DEFAULT_RATE : rate });
  } catch (e: any) {
    console.error('[GET /api/admin/settings/commission]', e);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
}

/**
 * POST /api/admin/settings/commission
 * Body: { commission_rate: number } — percentage between 0 and 100.
 * Updates site_settings and learning_products.commission_rate for all courses.
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const { userId: adminUserId } = await auth();

    const body = await request.json();
    const { commission_rate } = body;

    if (typeof commission_rate !== 'number' || isNaN(commission_rate)) {
      return NextResponse.json({ error: 'commission_rate must be a number' }, { status: 400 });
    }
    if (commission_rate < 0 || commission_rate > 100) {
      return NextResponse.json({ error: 'commission_rate must be between 0 and 100' }, { status: 400 });
    }

    // Store as a fraction in learning_products (e.g. 10% -> 0.10)
    const fraction = commission_rate / 100;

    // 1. Persist the setting
    const { error: settingError } = await supabaseAdmin
      .from('site_settings')
      .upsert({ key: SETTING_KEY, value: JSON.stringify(commission_rate) }, { onConflict: 'key' });

    if (settingError) {
      console.error('[commission] Failed to upsert setting:', settingError);
      return NextResponse.json({ error: 'Failed to save commission rate' }, { status: 500 });
    }

    // 2. Update all learning_products so the RPC uses the new rate immediately
    const { error: productError } = await supabaseAdmin
      .from('learning_products')
      .update({ commission_rate: fraction })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // update all rows

    if (productError) {
      console.error('[commission] Failed to update learning_products:', productError);
      // Non-fatal: setting is saved, products will pick it up on next sale
    }

    // 3. Audit log
    await logAdminAction({
      adminId: adminUserId || 'unknown',
      action: 'COMMISSION_RATE_UPDATED',
      details: { commission_rate, fraction },
    });

    return NextResponse.json({ success: true, commission_rate });
  } catch (e: any) {
    console.error('[POST /api/admin/settings/commission]', e);
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
  }
}
