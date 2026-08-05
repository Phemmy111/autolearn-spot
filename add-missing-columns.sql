-- Add Missing Columns to Partners Table
-- Run this in Supabase SQL Editor

-- Add whatsapp column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partners' 
    AND column_name = 'whatsapp'
  ) THEN
    ALTER TABLE partners 
    ADD COLUMN whatsapp TEXT;
  END IF;
END $$;

-- Add phone column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partners' 
    AND column_name = 'phone'
  ) THEN
    ALTER TABLE partners 
    ADD COLUMN phone TEXT;
  END IF;
END $$;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'partners' 
AND column_name IN ('whatsapp', 'phone')
ORDER BY column_name;