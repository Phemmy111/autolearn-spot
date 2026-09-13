-- Phase D: Make cohort-specific columns nullable in assignments table
-- This allows creating assignments for product-based lessons without cohort data

ALTER TABLE public.assignments
  ALTER COLUMN week_number DROP NOT NULL,
  ALTER COLUMN cohort_id DROP NOT NULL;

-- Drop old restrictive policies on submissions (not assignment_submissions)
DROP POLICY IF EXISTS "No direct inserts on submissions" ON public.submissions;
DROP POLICY IF EXISTS "No direct updates on submissions" ON public.submissions;
DROP POLICY IF EXISTS "No direct deletes on submissions" ON public.submissions;
DROP POLICY IF EXISTS "No direct selects on submissions" ON public.submissions;

-- Create service role policy first (highest priority)
CREATE POLICY "Service role can manage all submissions" ON public.submissions
  FOR ALL USING (auth.role() = 'service_role');

-- Create author policies for submission viewing
-- Authors can view submissions to their own lesson assignments
CREATE POLICY "Authors can view submissions to own lesson assignments" ON public.submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      JOIN public.lessons l ON l.uuid_id = a.lesson_id
      JOIN public.learning_products lp ON l.product_id = lp.id
      WHERE a.id = submissions.assignment_id
      AND lp.author_id = auth.jwt()->>'sub'
    )
  );

-- Authors can update submissions (grading and feedback)
CREATE POLICY "Authors can update submissions for own lesson assignments" ON public.submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.assignments a
      JOIN public.lessons l ON l.uuid_id = a.lesson_id
      JOIN public.learning_products lp ON l.product_id = lp.id
      WHERE a.id = submissions.assignment_id
      AND lp.author_id = auth.jwt()->>'sub'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assignments a
      JOIN public.lessons l ON l.uuid_id = a.lesson_id
      JOIN public.learning_products lp ON l.product_id = lp.id
      WHERE a.id = submissions.assignment_id
      AND lp.author_id = auth.jwt()->>'sub'
    )
  );
