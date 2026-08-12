-- Add Scholarship Settings
-- This migration adds database-backed configuration for scholarship programme settings
-- The values are initially set to maintain backward compatibility

INSERT INTO site_settings (key, value)
VALUES
  ('scholarship_commitment_fee', '5000'),
  ('scholarship_full_value', '8000'),
  ('scholarship_payment_url', 'https://paystack.shop/pay/lk12tlisnj'),
  ('scholarship_is_open', 'true'),
  ('scholarship_general_whatsapp', 'https://chat.whatsapp.com/DJrJYaW3nIy74xtFnZlJM3?s=cl&p=a&ilr=1&amv=3'),
  ('scholarship_paid_whatsapp', 'https://chat.whatsapp.com/DFTf7Z8il048brWDsvxUHA?s=cl&p=a&ilr=1&amv=3')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value;
