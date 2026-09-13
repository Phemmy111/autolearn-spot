-- Phase D: Make cohort-specific columns nullable in quizzes table
-- This allows creating quizzes for product-based lessons without cohort data

ALTER TABLE public.quizzes
  ALTER COLUMN week_number DROP NOT NULL,
  ALTER COLUMN cohort_id DROP NOT NULL;
