import { supabaseAdmin } from '@/lib/supabase';

const SETTING_KEYS = {
  minWithdrawal: 'partner_min_withdrawal',
};

const DEFAULT_VALUES = {
  minWithdrawal: 5000,
};

export interface PartnershipSettings {
  minWithdrawal: number;
}

/**
 * Get partnership settings from the database
 * Falls back to default values if settings don't exist
 */
export async function getPartnershipSettings(): Promise<PartnershipSettings> {
  try {
    const { data: settings, error } = await supabaseAdmin
      .from('site_settings')
      .select('key, value')
      .in('key', Object.values(SETTING_KEYS));

    if (error) {
      console.error('Error fetching partnership settings:', error);
      return DEFAULT_VALUES;
    }

    const values = { ...DEFAULT_VALUES };

    if (settings) {
      for (const setting of settings) {
        if (setting.key === SETTING_KEYS.minWithdrawal) {
          const amount = setting.value ? parseInt(setting.value, 10) : DEFAULT_VALUES.minWithdrawal;
          values.minWithdrawal = isNaN(amount) ? DEFAULT_VALUES.minWithdrawal : amount;
        }
      }
    }

    return values;
  } catch (e) {
    console.error('Error fetching partnership settings:', e);
    return DEFAULT_VALUES;
  }
}
