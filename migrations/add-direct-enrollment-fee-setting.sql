-- Add Direct Enrollment Fee Setting
-- This migration adds a database-backed configuration for the Direct Enrollment fee
-- The fee is initially set to ₦8,000 to maintain backward compatibility

INSERT INTO site_settings (key, value)
VALUES ('direct_enrollment_fee', '8000')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value;