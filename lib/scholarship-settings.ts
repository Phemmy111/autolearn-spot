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
  paymentUrl: process.env.NEXT_PUBLIC_PAYSTACK_SCHOLARSHIP_URL || 'https://paystack.shop/pay/lk12tlisnj',
  isOpen: true,
  generalWhatsApp: 'https://chat.whatsapp.com/DJrJYaW3nIy74xtFnZlJM3?s=cl&p=a&ilr=1&amv=3',
  paidWhatsApp: 'https://chat.whatsapp.com/DFTf7Z8il048brWDsvxUHA?s=cl&p=a&ilr=1&amv=3',
};

export interface ScholarshipSettings {
  commitmentFee: number;
  fullValue: number;
  paymentUrl: string;
  isOpen: boolean;
  generalWhatsApp: string;
  paidWhatsApp: string;
}

/**
 * Get scholarship settings from the database
 * Falls back to default values if settings don't exist
 */
export async function getScholarshipSettings(): Promise<ScholarshipSettings> {
  try {
    const { data: settings, error } = await supabaseAdmin
      .from('site_settings')
      .select('key, value')
      .in('key', Object.values(SETTING_KEYS));

    if (error) {
      console.error('Error fetching scholarship settings:', error);
      return DEFAULT_VALUES;
    }

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

    return values;
  } catch (e) {
    console.error('Error fetching scholarship settings:', e);
    return DEFAULT_VALUES;
  }
}
