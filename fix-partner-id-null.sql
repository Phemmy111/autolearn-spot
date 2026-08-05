-- Make partner_id nullable in partner_marketing_downloads table
-- Run this in Supabase SQL Editor

-- Make partner_id column nullable
ALTER TABLE partner_marketing_downloads 
ALTER COLUMN partner_id DROP NOT NULL;

-- Verify the change
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'partner_marketing_downloads' 
AND column_name = 'partner_id';