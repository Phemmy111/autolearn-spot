import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';
import { getPartnershipSettings } from '@/lib/partnership-settings';

const SETTING_KEYS = {
  minWithdrawal: 'partner_min_withdrawal',
  studentCommission: 'commission_rate_student',
  holdingPeriodDays: 'partner_holding_period_days',
};

const MAX_WITHDRAWAL = 1000000; // ₦1,000,000 maximum

export async function GET() {
  try {
    const settings = await getPartnershipSettings();
    return NextResponse.json(settings);
  } catch (e: any) {
    console.error('Error fetching partnership settings:', e);
    return NextResponse.json({ minWithdrawal: 1000, studentCommission: 1000, holdingPeriodDays: 7 });
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
    const { minWithdrawal, studentCommission, holdingPeriodDays } = body;

    // Validate min withdrawal
    if (minWithdrawal !== undefined) {
      if (typeof minWithdrawal !== 'number' || isNaN(minWithdrawal) || minWithdrawal <= 0) {
        return NextResponse.json({ error: 'Invalid minimum withdrawal amount' }, { status: 400 });
      }
      if (minWithdrawal > MAX_WITHDRAWAL) {
        return NextResponse.json({ error: `Maximum withdrawal limit is ₦${MAX_WITHDRAWAL.toLocaleString()}` }, { status: 400 });
      }
    }

    // Validate student commission
    if (studentCommission !== undefined) {
      if (typeof studentCommission !== 'number' || isNaN(studentCommission) || studentCommission < 0) {
        return NextResponse.json({ error: 'Invalid student commission: must be a positive number' }, { status: 400 });
      }
    }

    // Validate holding period
    if (holdingPeriodDays !== undefined) {
      if (typeof holdingPeriodDays !== 'number' || isNaN(holdingPeriodDays) || holdingPeriodDays < 0 || holdingPeriodDays > 60) {
        return NextResponse.json({ error: 'Holding period must be between 0 and 60 days' }, { status: 400 });
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

    if (studentCommission !== undefined) {
      updates.push(
        supabaseAdmin
          .from('site_settings')
          .upsert(
            { key: SETTING_KEYS.studentCommission, value: studentCommission.toString() },
            { onConflict: 'key' }
          )
      );
    }

    if (holdingPeriodDays !== undefined) {
      updates.push(
        supabaseAdmin
          .from('site_settings')
          .upsert(
            { key: SETTING_KEYS.holdingPeriodDays, value: holdingPeriodDays.toString() },
            { onConflict: 'key' }
          )
      );
    }

    // Execute updates
    const results = await Promise.all(updates);

    for (const result of results) {
      if (result.error) {
        console.error('Error updating partnership setting:', result.error);
        return NextResponse.json({ error: 'Failed to update settings in database' }, { status: 500 });
      }
    }

    const updated = await getPartnershipSettings();
    return NextResponse.json({ success: true, ...updated });
  } catch (e: any) {
    console.error('Error updating partnership settings:', e);
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}
