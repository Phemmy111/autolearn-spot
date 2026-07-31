-- Add name columns to enrollments table
-- This allows storing student names for personalized announcements

ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);

-- Add index for faster lookups by clerk_user_id with names
CREATE INDEX IF NOT EXISTS idx_enrollments_names ON enrollments(clerk_user_id, first_name, last_name);

-- Add comment
COMMENT ON COLUMN enrollments.first_name IS 'Student first name for personalized messaging';
COMMENT ON COLUMN enrollments.last_name IS 'Student last name for personalized messaging';
COMMENT ON COLUMN enrollments.full_name IS 'Student full name for certificates and formal communications';
