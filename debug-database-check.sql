-- Check actual database state

-- 1. Check enrollments with name columns
SELECT id, email, clerk_user_id, first_name, last_name, full_name, status FROM enrollments LIMIT 5;

-- 2. Check lesson_progress for a user
SELECT user_id, cohort_id, lesson_id, completed, watch_pct FROM lesson_progress LIMIT 10;

-- 3. Check quiz_responses with cohort_id
SELECT user_id, cohort_id, quiz_id, score, percentage FROM quiz_responses LIMIT 10;

-- 4. Check submissions
SELECT user_id, assignment_id, ai_score, status FROM submissions LIMIT 10;

-- 5. Check leaderboard current state
SELECT user_id, cohort_id, total_score, assignment_score, quiz_score, video_completion, user_name FROM leaderboard LIMIT 10;

-- 6. Check user_badges
SELECT user_id, badge_id, earned_at FROM user_badges LIMIT 10;

-- 7. Check quizzes available
SELECT id, cohort_id, title, is_active FROM quizzes LIMIT 10;

-- 8. Check assignments available
SELECT id, cohort_id, title, week_number FROM assignments LIMIT 10;

-- 9. Check lessons available
SELECT id, cohort_id, week_number FROM lessons LIMIT 10;
