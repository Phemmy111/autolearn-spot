import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';

const SETTING_KEYS = {
  minWithdrawal: 'partner_min_withdrawal',
};

const DEFAULT_VALUES = {
  minWithdrawal: 5000,
};

const MAX_WITHDRAWAL = 1000000; // ₦1,000,000 maximum

export async function GET(request: Request) {
  try {
    // Fetch partnership settings
    const { data: settings, error } = await supabaseAdmin
      .from('site_settings')
      .select('key, value')
      .in('key', Object.values(SETTING_KEYS));

    if (error) {
      console.error('Error fetching partnership settings:', error);
      // Fallback to defaults if settings don't exist
      return NextResponse.json(DEFAULT_VALUES);
    }

    // Map settings to values
    const values = { ...DEFAULT_VALUES };

    if (settings) {
      for (const setting of settings) {
        if (setting.key === SETTING_KEYS.minWithdrawal) {
          const amount = setting.value ? parseInt(setting.value, 10) : DEFAULT_VALUES.minWithdrawal;
          values.minWithdrawal = isNaN(amount) ? DEFAULT_VALUES.minWithdrawal : amount;
        }
      }
    }

    return NextResponse.json(values);
  } catch (e) {
    console.error('Error fetching partnership settings:', e);
    return NextResponse.json(DEFAULT_VALUES);
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { minWithdrawal } = body;

    // Validate min withdrawal
    if (minWithdrawal !== undefined) {
      if (typeof minWithdrawal !== 'number' || isNaN(minWithdrawal)) {
        return NextResponse.json({ error: 'Invalid minimum withdrawal: must be a number' }, { status: 400 });
      }
      if (minWithdrawal <= 0) {
        return NextResponse.json({ error: 'Invalid minimum withdrawal: must be greater than 0' }, { status: 400 });
      }
      if (minWithdrawal > MAX_WITHDRAWAL) {
        return NextResponse.json({ error: `Invalid minimum withdrawal: maximum amount is ₦${MAX_WITHDRAWAL.toLocaleString()}` }, { status: 400 });
      }
    }

    // Build updates array
    const updates = [];

    if (minWithdrawal !== undefined) {
      updates.push(
        supabaseAdmin
          .from('site_settings')
          .upsert(
            { key: SETTING_KEYS.minWithdrawal, value: minWithdrawal.toString() },
            { onConflict: 'key' }
          )
      );
    }

    // Execute all updates
    const results = await Promise.all(updates);

    // Check for errors
    for (const result of results) {
      if (result.error) {
        console.error('Error updating partnership setting:', result.error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
      }
    }

    // Return updated values
    const updatedValues = await GET(request);
    return updatedValues;
  } catch (e) {
    console.error('Error updating partnership settings:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
