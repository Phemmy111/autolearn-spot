-- Phase D: Make cohort-specific columns nullable in assignments table
-- This allows creating assignments for product-based lessons without cohort data

ALTER TABLE public.assignments
  ALTER COLUMN week_number DROP NOT NULL,
  ALTER COLUMN cohort_id DROP NOT NULL;
