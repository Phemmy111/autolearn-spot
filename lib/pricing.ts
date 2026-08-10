import { supabaseAdmin } from '@/lib/supabase';

const SETTING_KEY = 'direct_enrollment_fee';
const DEFAULT_FEE = 8000;

/**
 * Get the current Direct Enrollment fee from the database
 * Falls back to ₦8,000 if the setting is not configured
 */
export async function getDirectEnrollmentFee(): Promise<number> {
  try {
    const { data: setting, error } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', SETTING_KEY)
      .single();

    if (error) {
      console.error('Error fetching direct enrollment fee:', error);
      return DEFAULT_FEE;
    }

    const fee = setting?.value ? parseInt(setting.value, 10) : DEFAULT_FEE;
    return isNaN(fee) ? DEFAULT_FEE : fee;
  } catch (e) {
    console.error('Error fetching direct enrollment fee:', e);
    return DEFAULT_FEE;
  }
}