-- Add missing columns to assignments table for Phase 3
-- This adds due_date and max_score which are required for the assignment system

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assignments' AND column_name = 'due_date'
  ) THEN
    ALTER TABLE assignments ADD COLUMN due_date TIMESTAMP WITH TIME ZONE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assignments' AND column_name = 'max_score'
  ) THEN
    ALTER TABLE assignments ADD COLUMN max_score INTEGER DEFAULT 100;
  END IF;
END $$;

-- Note: The submissions table already has:
-- - score (ai_score column will be repurposed for admin scoring)
-- - feedback (ai_feedback column will be repurposed for admin feedback)
-- - status already supports 'submitted' and 'reviewed' states
-- - submitted_at can use created_at column
-- - student_email can be fetched from Clerk using user_id

-- Create index for due_date queries
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);
