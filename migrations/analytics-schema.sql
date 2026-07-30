-- Migration: Student Progress Analytics Schema
-- This migration adds tables and indexes for the centralized analytics service
-- Safe to re-run: uses IF NOT EXISTS throughout

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- New Tables for Analytics
-- =============================================================================

-- student_analytics_snapshot
CREATE TABLE IF NOT EXISTS student_analytics_snapshot (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  lessons_completed INTEGER NOT NULL DEFAULT 0,
  lessons_total INTEGER NOT NULL DEFAULT 0,
  lessons_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  assignments_completed INTEGER NOT NULL DEFAULT 0,
  assignments_total INTEGER NOT NULL DEFAULT 0,
  assignments_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  quizzes_completed INTEGER NOT NULL DEFAULT 0,
  quizzes_total INTEGER NOT NULL DEFAULT 0,
  quizzes_average_score DECIMAL(5,2) NOT NULL DEFAULT 0,
  overall_progress DECIMAL(5,2) NOT NULL DEFAULT 0,
  total_score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, cohort_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_analytics_snapshot_user_date ON student_analytics_snapshot(user_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_snapshot_cohort_date ON student_analytics_snapshot(cohort_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_snapshot_date ON student_analytics_snapshot(snapshot_date DESC);

-- login_activity
CREATE TABLE IF NOT EXISTS login_activity (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL,
  login_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  session_duration_seconds INTEGER,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_activity_user_time ON login_activity(user_id, login_time DESC);
CREATE INDEX IF NOT EXISTS idx_login_activity_cohort_time ON login_activity(cohort_id, login_time DESC);
CREATE INDEX IF NOT EXISTS idx_login_activity_time ON login_activity(login_time DESC);

-- =============================================================================
-- Add cohort_id columns to existing tables if they don't exist
-- =============================================================================

DO $$
BEGIN
  -- Add cohort_id to certificates if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'certificates' AND column_name = 'cohort_id'
  ) THEN
    ALTER TABLE certificates ADD COLUMN cohort_id UUID REFERENCES cohorts(id) ON DELETE CASCADE;
  END IF;

  -- Add cohort_id to leaderboard if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leaderboard' AND column_name = 'cohort_id'
  ) THEN
    ALTER TABLE leaderboard ADD COLUMN cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL;
  END IF;
END $$;

-- =============================================================================
-- New Indexes on Existing Tables
-- =============================================================================

-- lesson_progress indexes
CREATE INDEX IF NOT EXISTS idx_lesson_progress_completed ON lesson_progress(completed) WHERE completed = true;
CREATE INDEX IF NOT EXISTS idx_lesson_progress_updated_at ON lesson_progress(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_cohort_user_completed ON lesson_progress(cohort_id, user_id, completed);

-- submissions indexes
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_score ON submissions(assignment_id, ai_score) WHERE ai_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_submissions_user_status ON submissions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_cohort_user ON submissions(assignment_id, user_id);

-- quiz_responses indexes (only if cohort_id exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quiz_responses' AND column_name = 'cohort_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_quiz_responses_quiz_cohort ON quiz_responses(quiz_id, cohort_id);
    CREATE INDEX IF NOT EXISTS idx_quiz_responses_cohort_score ON quiz_responses(cohort_id, score DESC);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_quiz_responses_user_score ON quiz_responses(user_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_user_quiz ON quiz_responses(user_id, quiz_id, created_at DESC);

-- certificates indexes (only if cohort_id exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'certificates' AND column_name = 'cohort_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_certificates_cohort_issued ON certificates(cohort_id, issued_at DESC);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_certificates_issued_at ON certificates(issued_at DESC);

-- leaderboard indexes (only if cohort_id exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leaderboard' AND column_name = 'cohort_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_leaderboard_cohort_score_updated ON leaderboard(cohort_id, total_score DESC, updated_at DESC);
  END IF;
END $$;
