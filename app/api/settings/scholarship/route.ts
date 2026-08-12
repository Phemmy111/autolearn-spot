import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';

const SETTING_KEYS = {
  commitmentFee: 'scholarship_commitment_fee',
  fullValue: 'scholarship_full_value',
  paymentUrl: 'scholarship_payment_url',
  isOpen: 'scholarship_is_open',
  generalWhatsApp: 'scholarship_general_whatsapp',
  paidWhatsApp: 'scholarship_paid_whatsapp',
};

const DEFAULT_VALUES = {
  commitmentFee: 5000,
  fullValue: 8000,
  paymentUrl: 'https://paystack.shop/pay/lk12tlisnj',
  isOpen: true,
  generalWhatsApp: 'https://chat.whatsapp.com/DJrJYaW3nIy74xtFnZlJM3?s=cl&p=a&ilr=1&amv=3',
  paidWhatsApp: 'https://chat.whatsapp.com/DFTf7Z8il048brWDsvxUHA?s=cl&p=a&ilr=1&amv=3',
};

const MAX_FEE = 1000000; // ₦1,000,000 maximum

export async function GET(request: Request) {
  try {
    // Fetch all scholarship settings
    const { data: settings, error } = await supabaseAdmin
      .from('site_settings')
      .select('key, value')
      .in('key', Object.values(SETTING_KEYS));

    if (error) {
      console.error('Error fetching scholarship settings:', error);
      // Fallback to defaults if settings don't exist
      return NextResponse.json(DEFAULT_VALUES);
    }

    // Map settings to values
    const values = { ...DEFAULT_VALUES };

    if (settings) {
      for (const setting of settings) {
        if (setting.key === SETTING_KEYS.commitmentFee) {
          const fee = setting.value ? parseInt(setting.value, 10) : DEFAULT_VALUES.commitmentFee;
          values.commitmentFee = isNaN(fee) ? DEFAULT_VALUES.commitmentFee : fee;
        }
        if (setting.key === SETTING_KEYS.fullValue) {
          const value = setting.value ? parseInt(setting.value, 10) : DEFAULT_VALUES.fullValue;
          values.fullValue = isNaN(value) ? DEFAULT_VALUES.fullValue : value;
        }
        if (setting.key === SETTING_KEYS.paymentUrl) {
          values.paymentUrl = setting.value || DEFAULT_VALUES.paymentUrl;
        }
        if (setting.key === SETTING_KEYS.isOpen) {
          values.isOpen = setting.value === 'true';
        }
        if (setting.key === SETTING_KEYS.generalWhatsApp) {
          values.generalWhatsApp = setting.value || DEFAULT_VALUES.generalWhatsApp;
        }
        if (setting.key === SETTING_KEYS.paidWhatsApp) {
          values.paidWhatsApp = setting.value || DEFAULT_VALUES.paidWhatsApp;
        }
      }
    }

    return NextResponse.json(values);
  } catch (e) {
    console.error('Error fetching scholarship settings:', e);
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
    const { commitmentFee, fullValue, paymentUrl, isOpen, generalWhatsApp, paidWhatsApp } = body;

    // Validate commitment fee
    if (commitmentFee !== undefined) {
      if (typeof commitmentFee !== 'number' || isNaN(commitmentFee)) {
        return NextResponse.json({ error: 'Invalid commitment fee: must be a number' }, { status: 400 });
      }
      if (commitmentFee <= 0) {
        return NextResponse.json({ error: 'Invalid commitment fee: must be greater than 0' }, { status: 400 });
      }
      if (commitmentFee > MAX_FEE) {
        return NextResponse.json({ error: `Invalid commitment fee: maximum amount is ₦${MAX_FEE.toLocaleString()}` }, { status: 400 });
      }
    }

    // Validate full value
    if (fullValue !== undefined) {
      if (typeof fullValue !== 'number' || isNaN(fullValue)) {
        return NextResponse.json({ error: 'Invalid full value: must be a number' }, { status: 400 });
      }
      if (fullValue <= 0) {
        return NextResponse.json({ error: 'Invalid full value: must be greater than 0' }, { status: 400 });
      }
      if (fullValue > MAX_FEE) {
        return NextResponse.json({ error: `Invalid full value: maximum amount is ₦${MAX_FEE.toLocaleString()}` }, { status: 400 });
      }
    }

    // Validate payment URL
    if (paymentUrl !== undefined) {
      if (typeof paymentUrl !== 'string') {
        return NextResponse.json({ error: 'Invalid payment URL: must be a string' }, { status: 400 });
      }
      try {
        const url = new URL(paymentUrl);
        if (url.protocol !== 'https:') {
          return NextResponse.json({ error: 'Invalid payment URL: must use HTTPS' }, { status: 400 });
        }
      } catch {
        return NextResponse.json({ error: 'Invalid payment URL: must be a valid URL' }, { status: 400 });
      }
    }

    // Validate isOpen
    if (isOpen !== undefined) {
      if (typeof isOpen !== 'boolean') {
        return NextResponse.json({ error: 'Invalid isOpen: must be a boolean' }, { status: 400 });
      }
    }

    // Validate WhatsApp URLs
    if (generalWhatsApp !== undefined) {
      if (typeof generalWhatsApp !== 'string') {
        return NextResponse.json({ error: 'Invalid general WhatsApp URL: must be a string' }, { status: 400 });
      }
    }

    if (paidWhatsApp !== undefined) {
      if (typeof paidWhatsApp !== 'string') {
        return NextResponse.json({ error: 'Invalid paid WhatsApp URL: must be a string' }, { status: 400 });
      }
    }

    // Build updates array
    const updates = [];

    if (commitmentFee !== undefined) {
      updates.push(
        supabaseAdmin
          .from('site_settings')
          .upsert(
            { key: SETTING_KEYS.commitmentFee, value: commitmentFee.toString() },
            { onConflict: 'key' }
          )
      );
    }

    if (fullValue !== undefined) {
      updates.push(
        supabaseAdmin
          .from('site_settings')
          .upsert(
            { key: SETTING_KEYS.fullValue, value: fullValue.toString() },
            { onConflict: 'key' }
          )
      );
    }

    if (paymentUrl !== undefined) {
      updates.push(
        supabaseAdmin
          .from('site_settings')
          .upsert(
            { key: SETTING_KEYS.paymentUrl, value: paymentUrl },
            { onConflict: 'key' }
          )
      );
    }

    if (isOpen !== undefined) {
      updates.push(
        supabaseAdmin
          .from('site_settings')
          .upsert(
            { key: SETTING_KEYS.isOpen, value: isOpen.toString() },
            { onConflict: 'key' }
          )
      );
    }

    if (generalWhatsApp !== undefined) {
      updates.push(
        supabaseAdmin
          .from('site_settings')
          .upsert(
            { key: SETTING_KEYS.generalWhatsApp, value: generalWhatsApp },
            { onConflict: 'key' }
          )
      );
    }

    if (paidWhatsApp !== undefined) {
      updates.push(
        supabaseAdmin
          .from('site_settings')
          .upsert(
            { key: SETTING_KEYS.paidWhatsApp, value: paidWhatsApp },
            { onConflict: 'key' }
          )
      );
    }

    // Execute all updates
    const results = await Promise.all(updates);

    // Check for errors
    for (const result of results) {
      if (result.error) {
        console.error('Error updating scholarship setting:', result.error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
      }
    }

    // Return updated values
    const updatedValues = await GET(request);
    return updatedValues;
  } catch (e) {
    console.error('Error updating scholarship settings:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
