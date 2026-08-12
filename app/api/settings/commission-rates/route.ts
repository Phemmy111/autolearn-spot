import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';

const SETTING_KEYS = {
  student: 'commission_rate_student',
  community: 'commission_rate_community',
  influencer: 'commission_rate_influencer',
};

const DEFAULT_RATES = {
  student: 1500,
  community: 1500,
  influencer: 2500,
};

const MAX_COMMISSION_RATE = 100000; // ₦100,000 maximum

export async function GET(request: Request) {
  try {
    // Fetch all commission rates
    const { data: settings, error } = await supabaseAdmin
      .from('site_settings')
      .select('key, value')
      .in('key', Object.values(SETTING_KEYS));

    if (error) {
      console.error('Error fetching commission rates:', error);
      // Fallback to defaults if settings don't exist
      return NextResponse.json(DEFAULT_RATES);
    }

    // Map settings to rates
    const rates = {
      student: DEFAULT_RATES.student,
      community: DEFAULT_RATES.community,
      influencer: DEFAULT_RATES.influencer,
    };

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
        const rate = value ? parseInt(value, 10) : DEFAULT_RATES[setting.key as keyof typeof DEFAULT_RATES];
        if (!isNaN(rate)) {
          if (setting.key === SETTING_KEYS.student) rates.student = rate;
          if (setting.key === SETTING_KEYS.community) rates.community = rate;
          if (setting.key === SETTING_KEYS.influencer) rates.influencer = rate;
        }
      }
    }

    return NextResponse.json(rates);
  } catch (e) {
    console.error('Error fetching commission rates:', e);
    return NextResponse.json(DEFAULT_RATES);
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
    const { student, community, influencer } = body;

    // Validate all rates
    const rates = [
      { key: 'student', value: student, settingKey: SETTING_KEYS.student },
      { key: 'community', value: community, settingKey: SETTING_KEYS.community },
      { key: 'influencer', value: influencer, settingKey: SETTING_KEYS.influencer },
    ];

    for (const rate of rates) {
      if (typeof rate.value !== 'number' || isNaN(rate.value)) {
        return NextResponse.json(
          { error: `Invalid ${rate.key} rate: must be a number` },
          { status: 400 }
        );
      }

      if (rate.value < 0) {
        return NextResponse.json(
          { error: `Invalid ${rate.key} rate: must be greater than or equal to 0` },
          { status: 400 }
        );
      }

      if (rate.value > MAX_COMMISSION_RATE) {
        return NextResponse.json(
          { error: `Invalid ${rate.key} rate: maximum amount is ₦${MAX_COMMISSION_RATE.toLocaleString()}` },
          { status: 400 }
        );
      }
    }

    // Update all settings
    const updates = rates.map(rate =>
      supabaseAdmin
        .from('site_settings')
        .upsert(
          {
            key: rate.settingKey,
            value: JSON.stringify(rate.value.toString()),
          },
          { onConflict: 'key' }
        )
    );

    const results = await Promise.all(updates);

    // Check for errors
    for (let i = 0; i < results.length; i++) {
      if (results[i].error) {
        console.error(`Error updating ${rates[i].key} rate:`, results[i].error);
        return NextResponse.json(
          { error: `Failed to update ${rates[i].key} rate` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      rates: {
        student,
        community,
        influencer,
      },
    });
  } catch (e) {
    console.error('Error updating commission rates:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
