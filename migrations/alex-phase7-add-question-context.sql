-- Add context column to alex_artifact_questions for field mapping
-- This enables proper answer mapping when users respond to questions

ALTER TABLE alex_artifact_questions
ADD COLUMN IF NOT EXISTS context TEXT;

-- Add index for context queries
CREATE INDEX IF NOT EXISTS idx_alex_artifact_questions_context ON alex_artifact_questions(context);
