-- Add Commission Rate Settings
-- This migration adds database-backed configuration for partner commission rates
-- The rates are initially set to maintain backward compatibility:
-- Student Partner: ₦1,500
-- Community Partner: ₦1,500
-- Influencer Partner: ₦2,500

INSERT INTO site_settings (key, value)
VALUES
  ('commission_rate_student', '1500'),
  ('commission_rate_community', '1500'),
  ('commission_rate_influencer', '2500')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value;
