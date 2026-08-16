-- Fix ALEX RLS for Clerk authentication
-- Since the application uses Clerk (not Supabase Auth) and authorization
-- is handled by API routes (Clerk auth middleware), we disable RLS for ALEX tables
-- Authorization is handled at the API level, not database level

-- Disable RLS for ALEX tables (authorization handled by API routes with Clerk auth)
ALTER TABLE alex_provider_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE alex_conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE alex_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE alex_usage DISABLE ROW LEVEL SECURITY;

-- Note: If you prefer database-level security, you would need to:
-- 1. Create a function to extract Clerk user ID from the JWT
-- 2. Update RLS policies to use Clerk user identification
-- 3. Ensure the Clerk JWT is properly passed to Supabase
-- For this application, API-level authorization is preferred
