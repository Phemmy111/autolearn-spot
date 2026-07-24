-- Disable RLS on assignments and submissions tables
-- This follows the existing pattern for admin-managed tables (see supabase-rls-clerk-fix.sql)
-- Authorization is handled at the API route level using requireAdmin()

ALTER TABLE assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;
