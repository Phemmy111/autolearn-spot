-- Verification Script - Check if database schema is correct
-- Run this in Supabase SQL Editor to verify the schema

-- Check if partner_marketing_downloads table exists
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'partner_marketing_downloads'
ORDER BY ordinal_position;

-- Check if partners table has partner_id column
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'partners' 
AND column_name = 'partner_id';

-- Check if partner_bank_profiles table exists
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'partner_bank_profiles'
ORDER BY ordinal_position;

-- Check if partner_referrals table exists
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'partner_referrals'
ORDER BY ordinal_position;

-- Check if commissions table exists
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'commissions'
ORDER BY ordinal_position;

-- Check current data in partner_marketing_downloads
SELECT * FROM partner_marketing_downloads LIMIT 5;

-- Check current data in partners table
SELECT id, partner_id, full_name, email, partner_type, status FROM partners LIMIT 5;