-- Fix Existing Data - Update partner_id for existing records
-- Run this in Supabase SQL Editor after fix-partner-schema.sql

-- Update existing partners to have partner_id values
UPDATE partners 
SET partner_id = 'ALS' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 4, '0')
WHERE partner_id IS NULL;

-- Make partner_id column NOT NULL for future records
ALTER TABLE partners 
ALTER COLUMN partner_id SET NOT NULL;

-- Add unique constraint on partner_id
ALTER TABLE partners 
ADD CONSTRAINT unique_partner_id UNIQUE (partner_id);

-- Verify the updates
SELECT id, partner_id, full_name, email, partner_type, status 
FROM partners 
ORDER BY created_at;