-- Add profile_picture column to enrollments table
ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS profile_picture TEXT;
