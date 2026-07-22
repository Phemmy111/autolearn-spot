-- Migration script for legacy students
-- This script creates enrollment records for students who enrolled before the new enrollment system
-- It identifies them from quiz_responses and leaderboard tables and creates missing enrollment records

-- Step 1: Create enrollment records for users in leaderboard who don't have enrollments
INSERT INTO enrollments (cohort_id, email, clerk_user_id, status, activated_at, created_at, updated_at)
SELECT 
  'a1111111-1111-1111-1111-111111111111' as cohort_id,  -- Cohort 1
  user_email as email,
  user_id as clerk_user_id,
  'active' as status,
  NOW() as activated_at,
  NOW() as created_at,
  NOW() as updated_at
FROM leaderboard
WHERE user_email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM enrollments 
    WHERE enrollments.email = leaderboard.user_email
      AND enrollments.cohort_id = 'a1111111-1111-1111-1111-111111111111'
  )
ON CONFLICT (cohort_id, email) DO NOTHING;

-- Step 2: Create enrollment records for users in quiz_responses who don't have enrollments
INSERT INTO enrollments (cohort_id, email, clerk_user_id, status, activated_at, created_at, updated_at)
SELECT 
  'a1111111-1111-1111-1111-111111111111' as cohort_id,  -- Cohort 1
  user_email as email,
  user_id as clerk_user_id,
  'active' as status,
  NOW() as activated_at,
  NOW() as created_at,
  NOW() as updated_at
FROM quiz_responses
WHERE user_email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM enrollments 
    WHERE enrollments.email = quiz_responses.user_email
      AND enrollments.cohort_id = 'a1111111-1111-1111-1111-111111111111'
  )
ON CONFLICT (cohort_id, email) DO NOTHING;

-- Verification query: Check how many enrollment records were created
SELECT COUNT(*) as total_enrollments FROM enrollments WHERE cohort_id = 'a1111111-1111-1111-1111-111111111111';

-- Verification query: Check for users who still might be missing (should return 0 if successful)
SELECT 
  'leaderboard' as source, 
  COUNT(*) as count
FROM leaderboard l
WHERE l.user_email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM enrollments e 
    WHERE e.email = l.user_email
      AND e.cohort_id = 'a1111111-1111-1111-1111-111111111111'
  )
UNION ALL
SELECT 
  'quiz_responses' as source, 
  COUNT(*) as count
FROM quiz_responses q
WHERE q.user_email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM enrollments e 
    WHERE e.email = q.user_email
      AND e.cohort_id = 'a1111111-1111-1111-1111-111111111111'
  );
