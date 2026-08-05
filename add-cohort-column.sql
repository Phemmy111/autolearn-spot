-- Add cohort column to pending_enrollments table
ALTER TABLE pending_enrollments 
ADD COLUMN IF NOT EXISTS cohort TEXT DEFAULT 'Cohort 2';

-- Add cohort column to enrollments table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'enrollments') THEN
        ALTER TABLE enrollments 
        ADD COLUMN IF NOT EXISTS cohort TEXT DEFAULT 'Cohort 2';
    END IF;
END $$;