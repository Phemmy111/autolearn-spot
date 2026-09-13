-- Phase D: Add RLS policies for author quiz response viewing
-- This enables authors to view student responses to their lesson quizzes

-- Drop old restrictive policies on quiz_responses
DROP POLICY IF EXISTS "No direct inserts on quiz_responses" ON public.quiz_responses;
DROP POLICY IF EXISTS "No direct updates on quiz_responses" ON public.quiz_responses;
DROP POLICY IF EXISTS "No direct deletes on quiz_responses" ON public.quiz_responses;
DROP POLICY IF EXISTS "No direct selects on quiz_responses" ON public.quiz_responses;

-- Create service role policy first (highest priority)
CREATE POLICY "Service role can manage all quiz_responses" ON public.quiz_responses
  FOR ALL USING (auth.role() = 'service_role');

-- Create author policies for quiz response viewing
-- Authors can view responses to their own lesson quizzes
CREATE POLICY "Authors can view responses to own lesson quizzes" ON public.quiz_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      JOIN public.lessons l ON l.uuid_id = q.lesson_id
      JOIN public.learning_products lp ON l.product_id = lp.id
      WHERE q.id = quiz_responses.quiz_id
      AND lp.author_id = auth.jwt()->>'sub'
    )
  );
