-- Create assignments and submissions tables for Phase 3
-- This script creates the tables from scratch

CREATE TABLE IF NOT EXISTS assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  lesson_id VARCHAR(100),
  week_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  instructions TEXT,
  submission_type VARCHAR(50) NOT NULL DEFAULT 'url', -- screenshot | url | both
  rubric TEXT,
  ai_review_prompt TEXT,
  is_required BOOLEAN NOT NULL DEFAULT true,
  due_date TIMESTAMP WITH TIME ZONE,
  max_score INTEGER DEFAULT 100,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assignments_cohort ON assignments(cohort_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);

CREATE TABLE IF NOT EXISTS submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  screenshot_url TEXT,
  live_url TEXT,
  notes TEXT,
  ai_feedback TEXT,
  ai_score INTEGER,
  status VARCHAR(50) NOT NULL DEFAULT 'submitted', -- submitted | approved | needs_revision
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (assignment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_submissions_user ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);

-- Note: RLS is disabled for assignments and submissions tables
-- Authorization is handled at the API route level using requireAdmin()
-- This follows the existing pattern for admin-managed tables (see supabase-rls-clerk-fix.sql)
