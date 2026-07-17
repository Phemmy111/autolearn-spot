-- Fix RLS for Clerk authentication
-- Since the application uses Clerk (not Supabase Auth) and authorization
-- is handled by API routes (requireSuperAdmin, requireAdmin), we will:
-- 1. Disable RLS for admin tables (authorization handled by API routes)
-- 2. Keep RLS for user-facing tables with simple public access policies

-- Disable RLS for admin tables (authorization handled by API routes)
ALTER TABLE ai_providers DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_prompts DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_cost_controls DISABLE ROW LEVEL SECURITY;
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes DISABLE ROW LEVEL SECURITY;
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;

-- Enable RLS for user-facing tables only
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies on leaderboard
DROP POLICY IF EXISTS "Public can view leaderboard" ON leaderboard;
DROP POLICY IF EXISTS "No direct inserts on leaderboard" ON leaderboard;
DROP POLICY IF EXISTS "No direct updates on leaderboard" ON leaderboard;
DROP POLICY IF EXISTS "No direct deletes on leaderboard" ON leaderboard;

-- Create simple public access policy for leaderboard
CREATE POLICY "Public can view leaderboard" ON leaderboard
  FOR SELECT USING (true);
