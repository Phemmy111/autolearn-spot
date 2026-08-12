-- Add Partnership Minimum Withdrawal Setting
-- This migration adds a database-backed configuration for the minimum partner withdrawal amount
-- The initial value is set to ₦5,000 to maintain backward compatibility

INSERT INTO site_settings (key, value)
VALUES ('partner_min_withdrawal', '5000')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value;
