import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';

const SETTING_KEY = 'direct_enrollment_fee';
const DEFAULT_FEE = 8000;

export async function GET(request: Request) {
  try {
    // Fetch current direct enrollment fee
    const { data: setting, error } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', SETTING_KEY)
      .single();

    if (error) {
      console.error('Error fetching direct enrollment fee:', error);
      // Fallback to default if setting doesn't exist
      return NextResponse.json({ fee: DEFAULT_FEE });
    }

    // Parse the value as integer, fallback to default if invalid
    const fee = setting?.value ? parseInt(setting.value, 10) : DEFAULT_FEE;
    return NextResponse.json({ fee: isNaN(fee) ? DEFAULT_FEE : fee });
  } catch (e) {
    console.error('Error fetching direct enrollment fee:', e);
    return NextResponse.json({ fee: DEFAULT_FEE });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { fee } = await request.json();

    // Validate the fee
    if (typeof fee !== 'number' || isNaN(fee)) {
      return NextResponse.json({ error: 'Invalid fee: must be a number' }, { status: 400 });
    }

    if (fee <= 0) {
      return NextResponse.json({ error: 'Invalid fee: must be greater than 0' }, { status: 400 });
    }

    if (fee > 1000000) {
      return NextResponse.json({ error: 'Invalid fee: maximum amount is ₦1,000,000' }, { status: 400 });
    }

    // Update the setting
    const { error } = await supabaseAdmin
      .from('site_settings')
      .upsert(
        { key: SETTING_KEY, value: fee.toString() },
        { onConflict: 'key' }
      );

    if (error) {
      console.error('Error updating direct enrollment fee:', error);
      return NextResponse.json({ error: 'Failed to update fee' }, { status: 500 });
    }

    return NextResponse.json({ success: true, fee });
  } catch (e) {
    console.error('Error updating direct enrollment fee:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}