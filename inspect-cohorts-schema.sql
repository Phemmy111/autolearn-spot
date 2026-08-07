-- STEP 1: Inspect current database schema

-- Check if cohorts table exists
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'cohorts'
ORDER BY ordinal_position;

-- Check existing indexes on cohorts table
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'cohorts';

-- Check existing RLS policies on cohorts table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'cohorts';

-- Check if the table exists at all
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'cohorts'
) as table_exists;
