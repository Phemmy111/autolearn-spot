-- Phase D: Add lesson support to quizzes and assignments
-- This enables quiz and assignment management within lesson editor

-- QUIZZES
-- Drop lesson_id column if it exists with wrong type
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quizzes'
    AND column_name = 'lesson_id'
    AND data_type = 'character varying'
  ) THEN
    ALTER TABLE public.quizzes DROP COLUMN lesson_id;
  END IF;
END $$;

-- Add lesson_id column to quizzes table (UUID to match lessons.uuid_id - the primary key)
ALTER TABLE public.quizzes
  ADD COLUMN IF NOT EXISTS lesson_id UUID REFERENCES public.lessons(uuid_id) ON DELETE CASCADE;

-- Add index for lesson-based quizzes
CREATE INDEX IF NOT EXISTS idx_quizzes_lesson_id ON public.quizzes(lesson_id);

-- ASSIGNMENTS
-- Drop lesson_id column if it exists with wrong type
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assignments'
    AND column_name = 'lesson_id'
    AND data_type = 'character varying'
  ) THEN
    ALTER TABLE public.assignments DROP COLUMN lesson_id;
  END IF;
END $$;

-- Add lesson_id column to assignments table (UUID to match lessons.uuid_id - the primary key)
ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS lesson_id UUID REFERENCES public.lessons(uuid_id) ON DELETE CASCADE;

-- Make cohort_id nullable in assignments to support lesson-based assignments
ALTER TABLE public.assignments
  ALTER COLUMN cohort_id DROP NOT NULL;

-- Add index for lesson-based assignments
CREATE INDEX IF NOT EXISTS idx_assignments_lesson_id ON public.assignments(lesson_id);

-- Add lesson quiz configuration to lessons unlock_config
-- This will be managed via the unlock_config JSONB field
-- Example structure: {"quiz_required": true, "quiz_id": "uuid", "assignment_required": false}

-- RLS policies for author quiz management
-- Note: Quizzes table doesn't have RLS enabled in the existing schema
-- Authorization is handled at the API route level using admin checks
-- For author lesson quizzes, we'll handle authorization via API routes

-- RLS policies for author assignment management
-- Note: Assignments table has RLS disabled per existing schema
-- Authorization is handled at the API route level using admin checks
-- For author lesson assignments, we'll handle authorization via API routes

-- RLS policies for author assignment management
-- Authors can view assignments for their own lessons
DROP POLICY IF EXISTS "Authors can view assignments for own lessons" ON public.assignments;
CREATE POLICY "Authors can view assignments for own lessons" ON public.assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.learning_products lp ON l.product_id = lp.id
      WHERE l.uuid_id = assignments.lesson_id
      AND lp.author_id = auth.jwt()->>'sub'
    )
  );

-- Authors can insert assignments for their own lessons
DROP POLICY IF EXISTS "Authors can insert assignments for own lessons" ON public.assignments;
CREATE POLICY "Authors can insert assignments for own lessons" ON public.assignments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.learning_products lp ON l.product_id = lp.id
      WHERE l.uuid_id = assignments.lesson_id
      AND lp.author_id = auth.jwt()->>'sub'
      AND lp.status IN ('DRAFT', 'UNPUBLISHED')
    )
  );

-- Authors can update assignments for their own lessons
DROP POLICY IF EXISTS "Authors can update assignments for own lessons" ON public.assignments;
CREATE POLICY "Authors can update assignments for own lessons" ON public.assignments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.learning_products lp ON l.product_id = lp.id
      WHERE l.uuid_id = assignments.lesson_id
      AND lp.author_id = auth.jwt()->>'sub'
      AND lp.status IN ('DRAFT', 'UNPUBLISHED')
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.learning_products lp ON l.product_id = lp.id
      WHERE l.uuid_id = assignments.lesson_id
      AND lp.author_id = auth.jwt()->>'sub'
      AND lp.status IN ('DRAFT', 'UNPUBLISHED')
    )
  );

-- Authors can delete assignments for their own lessons
DROP POLICY IF EXISTS "Authors can delete assignments for own lessons" ON public.assignments;
CREATE POLICY "Authors can delete assignments for own lessons" ON public.assignments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.learning_products lp ON l.product_id = lp.id
      WHERE l.uuid_id = assignments.lesson_id
      AND lp.author_id = auth.jwt()->>'sub'
      AND lp.status IN ('DRAFT', 'UNPUBLISHED')
    )
  );
