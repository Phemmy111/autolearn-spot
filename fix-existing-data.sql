-- Fix Existing Data - Update partner_id for existing records
-- Run this in Supabase SQL Editor after fix-partner-schema.sql

-- Create a temporary sequence for generating partner IDs
CREATE TEMPORARY SEQUENCE temp_partner_id_seq;

-- Update existing partners to have partner_id values using the sequence
UPDATE partners 
SET partner_id = 'ALS' || LPAD(nextval('temp_partner_id_seq')::TEXT, 4, '0')
WHERE partner_id IS NULL;

-- Drop the temporary sequence
DROP SEQUENCE temp_partner_id_seq;

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