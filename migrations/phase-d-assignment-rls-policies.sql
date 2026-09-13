-- Phase D: Add RLS policies for author assignment and submission management
-- This enables authors to manage assignments and view student submissions

-- Drop old restrictive policies on assignments
DROP POLICY IF EXISTS "No direct inserts on assignments" ON public.assignments;
DROP POLICY IF EXISTS "No direct updates on assignments" ON public.assignments;
DROP POLICY IF EXISTS "No direct deletes on assignments" ON public.assignments;
DROP POLICY IF EXISTS "No direct selects on assignments" ON public.assignments;

-- Create service role policy first (highest priority)
CREATE POLICY "Service role can manage all assignments" ON public.assignments
  FOR ALL USING (auth.role() = 'service_role');

-- Create author policies for lesson-based assignment management
-- Authors can view assignments for their own lessons
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
CREATE POLICY "Authors can insert assignments for own lessons" ON public.assignments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.learning_products lp ON l.product_id = lp.id
      WHERE l.uuid_id = assignments.lesson_id
      AND lp.author_id = auth.jwt()->>'sub'
    )
  );

-- Authors can update assignments for their own lessons
CREATE POLICY "Authors can update assignments for own lessons" ON public.assignments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.learning_products lp ON l.product_id = lp.id
      WHERE l.uuid_id = assignments.lesson_id
      AND lp.author_id = auth.jwt()->>'sub'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.learning_products lp ON l.product_id = lp.id
      WHERE l.uuid_id = assignments.lesson_id
      AND lp.author_id = auth.jwt()->>'sub'
    )
  );

-- Authors can delete assignments for their own lessons
CREATE POLICY "Authors can delete assignments for own lessons" ON public.assignments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.learning_products lp ON l.product_id = lp.id
      WHERE l.uuid_id = assignments.lesson_id
      AND lp.author_id = auth.jwt()->>'sub'
    )
  );

-- Drop old restrictive policies on assignment_submissions
DROP POLICY IF EXISTS "No direct inserts on assignment_submissions" ON public.assignment_submissions;
DROP POLICY IF EXISTS "No direct updates on assignment_submissions" ON public.assignment_submissions;
DROP POLICY IF EXISTS "No direct deletes on assignment_submissions" ON public.assignment_submissions;
DROP POLICY IF EXISTS "No direct selects on assignment_submissions" ON public.assignment_submissions;

-- Create service role policy first (highest priority)
CREATE POLICY "Service role can manage all assignment_submissions" ON public.assignment_submissions
  FOR ALL USING (auth.role() = 'service_role');

-- Create author policies for assignment submission viewing
-- Authors can view submissions to their own lesson assignments
CREATE POLICY "Authors can view submissions to own lesson assignments" ON public.assignment_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      JOIN public.lessons l ON l.uuid_id = a.lesson_id
      JOIN public.learning_products lp ON l.product_id = lp.id
      WHERE a.id = assignment_submissions.assignment_id
      AND lp.author_id = auth.jwt()->>'sub'
    )
  );

-- Authors can update submissions (grading and feedback)
CREATE POLICY "Authors can update submissions for own lesson assignments" ON public.assignment_submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      JOIN public.lessons l ON l.uuid_id = a.lesson_id
      JOIN public.learning_products lp ON l.product_id = lp.id
      WHERE a.id = assignment_submissions.assignment_id
      AND lp.author_id = auth.jwt()->>'sub'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assignments a
      JOIN public.lessons l ON l.uuid_id = a.lesson_id
      JOIN public.learning_products lp ON l.product_id = lp.id
      WHERE a.id = assignment_submissions.assignment_id
      AND lp.author_id = auth.jwt()->>'sub'
    )
  );
