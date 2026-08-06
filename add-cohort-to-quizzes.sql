-- Add cohort_id column to quizzes table
ALTER TABLE quizzes 
ADD COLUMN IF NOT EXISTS cohort_id TEXT DEFAULT 'Cohort 1';
