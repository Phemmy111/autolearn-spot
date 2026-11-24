import { supabaseAdmin } from '@/lib/supabase';

const SETTING_KEYS = {
  minWithdrawal: 'partner_min_withdrawal',
  studentCommission: 'commission_rate_student',
  holdingPeriodDays: 'partner_holding_period_days',
};

const DEFAULT_VALUES = {
  minWithdrawal: 1000,
  studentCommission: 1000,
  holdingPeriodDays: 7,
};

export interface PartnershipSettings {
  minWithdrawal: number;
  studentCommission: number;
  holdingPeriodDays: number;
}

/**
 * Get partnership settings from the database (site_settings table)
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
        let value = setting.value;
        if (typeof value === 'string') {
          try {
            const parsed = JSON.parse(value);
            if (typeof parsed === 'string' || typeof parsed === 'number') {
              value = parsed;
            }
          } catch {
            // keep raw value
          }
        }

        const numVal = parseInt(String(value), 10);

        if (setting.key === SETTING_KEYS.minWithdrawal && !isNaN(numVal)) {
          values.minWithdrawal = numVal;
        } else if (setting.key === SETTING_KEYS.studentCommission && !isNaN(numVal)) {
          values.studentCommission = numVal;
        } else if (setting.key === SETTING_KEYS.holdingPeriodDays && !isNaN(numVal)) {
          values.holdingPeriodDays = numVal;
        }
      }
    }

    return values;
  } catch (e) {
    console.error('Error fetching partnership settings:', e);
    return DEFAULT_VALUES;
  }
}
