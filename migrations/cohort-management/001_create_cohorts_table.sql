-- Sprint 1 Phase 1: Create scalable cohort database foundation
-- This creates a proper cohorts table to support unlimited cohorts

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create cohorts table
CREATE TABLE IF NOT EXISTS cohorts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'upcoming', 'active', 'completed', 'archived')),
  registration_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
  max_students INTEGER,
  current_students INTEGER DEFAULT 0,
  registration_open BOOLEAN DEFAULT false,
  registration_start TIMESTAMP WITH TIME ZONE,
  registration_end TIMESTAMP WITH TIME ZONE,
  cohort_start TIMESTAMP WITH TIME ZONE,
  cohort_end TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(255) -- Clerk user ID of who created this cohort
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_cohorts_status ON cohorts(status);
CREATE INDEX IF NOT EXISTS idx_cohorts_is_active ON cohorts(is_active);
CREATE INDEX IF NOT EXISTS idx_cohorts_registration_dates ON cohorts(registration_start, registration_end);
CREATE INDEX IF NOT EXISTS idx_cohorts_cohort_dates ON cohorts(cohort_start, cohort_end);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cohorts_updated_at
  BEFORE UPDATE ON cohorts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert Cohort 1 as the initial active cohort
INSERT INTO cohorts (
  name,
  description,
  status,
  registration_fee,
  max_students,
  current_students,
  registration_open,
  registration_start,
  registration_end,
  cohort_start,
  cohort_end,
  is_active,
  created_by
) VALUES (
  'Cohort 1',
  'The inaugural AutoLearn Spot cohort',
  'active',
  0,
  NULL,
  0,
  false,
  NULL,
  NULL,
  NULL,
  NULL,
  true,
  'system'
) ON CONFLICT DO NOTHING;
