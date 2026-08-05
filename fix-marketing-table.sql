-- Fix Marketing Downloads Table - Add Missing Columns
-- Run this in Supabase SQL Editor

-- Add category column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partner_marketing_downloads' 
    AND column_name = 'category'
  ) THEN
    ALTER TABLE partner_marketing_downloads 
    ADD COLUMN category TEXT DEFAULT 'general';
  END IF;
END $$;

-- Add type column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partner_marketing_downloads' 
    AND column_name = 'type'
  ) THEN
    ALTER TABLE partner_marketing_downloads 
    ADD COLUMN type TEXT DEFAULT 'flyer';
  END IF;
END $$;

-- Add description column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partner_marketing_downloads' 
    AND column_name = 'description'
  ) THEN
    ALTER TABLE partner_marketing_downloads 
    ADD COLUMN description TEXT;
  END IF;
END $$;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'partner_marketing_downloads' 
ORDER BY ordinal_position;