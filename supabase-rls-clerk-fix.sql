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

-- Enable RLS for user-facing tables
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies on user-facing tables
DROP POLICY IF EXISTS "Public can view active quizzes" ON quizzes;
DROP POLICY IF EXISTS "Admins can view all quizzes" ON quizzes;
DROP POLICY IF EXISTS "No direct selects on quizzes" ON quizzes;
DROP POLICY IF EXISTS "No direct inserts on quizzes" ON quizzes;
DROP POLICY IF EXISTS "No direct updates on quizzes" ON quizzes;
DROP POLICY IF EXISTS "No direct deletes on quizzes" ON quizzes;
DROP POLICY IF EXISTS "Admins can insert quizzes" ON quizzes;
DROP POLICY IF EXISTS "Admins can update quizzes" ON quizzes;
DROP POLICY IF EXISTS "Admins can delete quizzes" ON quizzes;

DROP POLICY IF EXISTS "Public can view questions for active quizzes" ON questions;
DROP POLICY IF EXISTS "Admins can view all questions" ON questions;
DROP POLICY IF EXISTS "No direct selects on questions" ON questions;
DROP POLICY IF EXISTS "No direct inserts on questions" ON questions;
DROP POLICY IF EXISTS "No direct updates on questions" ON questions;
DROP POLICY IF EXISTS "No direct deletes on questions" ON questions;
DROP POLICY IF EXISTS "Admins can insert questions" ON questions;
DROP POLICY IF EXISTS "Admins can update questions" ON questions;
DROP POLICY IF EXISTS "Admins can delete questions" ON questions;

DROP POLICY IF EXISTS "Users can view own responses" ON quiz_responses;
DROP POLICY IF EXISTS "Users can insert own responses" ON quiz_responses;
DROP POLICY IF EXISTS "Admins can view all responses" ON quiz_responses;
DROP POLICY IF EXISTS "Admins can insert responses" ON quiz_responses;
DROP POLICY IF EXISTS "Admins can update responses" ON quiz_responses;
DROP POLICY IF EXISTS "Admins can update quiz_responses" ON quiz_responses;
DROP POLICY IF EXISTS "Admins can delete responses" ON quiz_responses;
DROP POLICY IF EXISTS "Admins can delete quiz_responses" ON quiz_responses;
DROP POLICY IF EXISTS "No direct selects on quiz_responses" ON quiz_responses;
DROP POLICY IF EXISTS "No direct updates on quiz_responses" ON quiz_responses;
DROP POLICY IF EXISTS "No direct deletes on quiz_responses" ON quiz_responses;

DROP POLICY IF EXISTS "Public can view leaderboard" ON leaderboard;
DROP POLICY IF EXISTS "No direct inserts on leaderboard" ON leaderboard;
DROP POLICY IF EXISTS "No direct updates on leaderboard" ON leaderboard;
DROP POLICY IF EXISTS "No direct deletes on leaderboard" ON leaderboard;

-- Create simple public access policies for user-facing tables
CREATE POLICY "Public can view active quizzes" ON quizzes
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view questions for active quizzes" ON questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quizzes 
      WHERE quizzes.id = questions.quiz_id 
      AND quizzes.is_active = true
    )
  );

CREATE POLICY "Public can view leaderboard" ON leaderboard
  FOR SELECT USING (true);

-- Note: quiz_responses RLS is handled by the application logic
-- since it requires user authentication through Clerk
-- We'll disable RLS for quiz_responses as well since authorization is handled by API routes
ALTER TABLE quiz_responses DISABLE ROW LEVEL SECURITY;
