import { supabaseAdmin } from '@/lib/supabase';

type PartnerType = 'student' | 'community' | 'influencer';

const DEFAULT_RATES: Record<PartnerType, number> = {
  student: 1500,
  community: 1500,
  influencer: 2500,
};

const SETTING_KEYS: Record<PartnerType, string> = {
  student: 'commission_rate_student',
  community: 'commission_rate_community',
  influencer: 'commission_rate_influencer',
};

/**
 * Get the current commission rate for a specific partner type from the database
 * Falls back to default values if the setting is not configured
 */
export async function getCommissionRate(partnerType: PartnerType): Promise<number> {
  try {
    const settingKey = SETTING_KEYS[partnerType];
    const defaultRate = DEFAULT_RATES[partnerType];

    const { data: setting, error } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', settingKey)
      .single();

    if (error) {
      console.error(`Error fetching commission rate for ${partnerType}:`, error);
      return defaultRate;
    }

    const rate = setting?.value ? parseInt(setting.value, 10) : defaultRate;
    return isNaN(rate) ? defaultRate : rate;
  } catch (e) {
    console.error(`Error fetching commission rate for ${partnerType}:`, e);
    return DEFAULT_RATES[partnerType];
  }
}

/**
 * Get all commission rates at once
 * Useful for admin UI or batch operations
 */
export async function getAllCommissionRates(): Promise<{
  student: number;
  community: number;
  influencer: number;
}> {
  const [student, community, influencer] = await Promise.all([
    getCommissionRate('student'),
    getCommissionRate('community'),
    getCommissionRate('influencer'),
  ]);

  return { student, community, influencer };
}
