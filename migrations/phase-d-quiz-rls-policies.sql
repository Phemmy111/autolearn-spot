-- Phase D: Add RLS policies for author lesson quiz management
-- This enables authors to create quizzes for their own lessons

-- Drop old restrictive policies on quizzes
DROP POLICY IF EXISTS "No direct inserts on quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "No direct updates on quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "No direct deletes on quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "No direct selects on quizzes" ON public.quizzes;

-- Create service role policy first (highest priority)
CREATE POLICY "Service role can manage all quizzes" ON public.quizzes
  FOR ALL USING (auth.role() = 'service_role');

-- Create author policies for lesson-based quiz management
-- Authors can view quizzes for their own lessons
CREATE POLICY "Authors can view quizzes for own lessons" ON public.quizzes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.learning_products lp ON l.product_id = lp.id
      WHERE l.uuid_id = quizzes.lesson_id
      AND lp.author_id = auth.jwt()->>'sub'
    )
  );

-- Authors can insert quizzes for their own lessons
CREATE POLICY "Authors can insert quizzes for own lessons" ON public.quizzes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.learning_products lp ON l.product_id = lp.id
      WHERE l.uuid_id = quizzes.lesson_id
      AND lp.author_id = auth.jwt()->>'sub'
    )
  );

-- Authors can update quizzes for their own lessons
CREATE POLICY "Authors can update quizzes for own lessons" ON public.quizzes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.learning_products lp ON l.product_id = lp.id
      WHERE l.uuid_id = quizzes.lesson_id
      AND lp.author_id = auth.jwt()->>'sub'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.learning_products lp ON l.product_id = lp.id
      WHERE l.uuid_id = quizzes.lesson_id
      AND lp.author_id = auth.jwt()->>'sub'
    )
  );

-- Authors can delete quizzes for their own lessons
CREATE POLICY "Authors can delete quizzes for own lessons" ON public.quizzes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.learning_products lp ON l.product_id = lp.id
      WHERE l.uuid_id = quizzes.lesson_id
      AND lp.author_id = auth.jwt()->>'sub'
    )
  );

-- Drop old restrictive policies on questions
DROP POLICY IF EXISTS "No direct inserts on questions" ON public.questions;
DROP POLICY IF EXISTS "No direct updates on questions" ON public.questions;
DROP POLICY IF EXISTS "No direct deletes on questions" ON public.questions;
DROP POLICY IF EXISTS "No direct selects on questions" ON public.questions;

-- Create service role policy first (highest priority)
CREATE POLICY "Service role can manage all questions" ON public.questions
  FOR ALL USING (auth.role() = 'service_role');

-- Create author policies for lesson-based question management
-- Authors can view questions for their own lesson quizzes
CREATE POLICY "Authors can view questions for own lesson quizzes" ON public.questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      JOIN public.lessons l ON l.uuid_id = q.lesson_id
      JOIN public.learning_products lp ON l.product_id = lp.id
      WHERE q.id = questions.quiz_id
      AND lp.author_id = auth.jwt()->>'sub'
    )
  );

-- Authors can insert questions for their own lesson quizzes
CREATE POLICY "Authors can insert questions for own lesson quizzes" ON public.questions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      JOIN public.lessons l ON l.uuid_id = q.lesson_id
      JOIN public.learning_products lp ON l.product_id = lp.id
      WHERE q.id = questions.quiz_id
      AND lp.author_id = auth.jwt()->>'sub'
    )
  );

-- Authors can update questions for their own lesson quizzes
CREATE POLICY "Authors can update questions for own lesson quizzes" ON public.questions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      JOIN public.lessons l ON l.uuid_id = q.lesson_id
      JOIN public.learning_products lp ON l.product_id = lp.id
      WHERE q.id = questions.quiz_id
      AND lp.author_id = auth.jwt()->>'sub'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      JOIN public.lessons l ON l.uuid_id = q.lesson_id
      JOIN public.learning_products lp ON l.product_id = lp.id
      WHERE q.id = questions.quiz_id
      AND lp.author_id = auth.jwt()->>'sub'
    )
  );

-- Authors can delete questions for their own lesson quizzes
CREATE POLICY "Authors can delete questions for own lesson quizzes" ON public.questions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.quizzes q
      JOIN public.lessons l ON l.uuid_id = q.lesson_id
      JOIN public.learning_products lp ON l.product_id = lp.id
      WHERE q.id = questions.quiz_id
      AND lp.author_id = auth.jwt()->>'sub'
    )
  );
