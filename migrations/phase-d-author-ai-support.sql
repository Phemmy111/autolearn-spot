-- Phase D: Add author support to AI providers and prompts
-- This enables authors to configure their own AI providers and prompts for quiz generation

-- Add author_id column to ai_providers
ALTER TABLE public.ai_providers
  ADD COLUMN IF NOT EXISTS author_id VARCHAR(255);

-- Add index for author-specific providers
CREATE INDEX IF NOT EXISTS idx_ai_providers_author_id ON public.ai_providers(author_id);

-- Add author_id column to ai_prompts
ALTER TABLE public.ai_prompts
  ADD COLUMN IF NOT EXISTS author_id VARCHAR(255);

-- Add index for author-specific prompts
CREATE INDEX IF NOT EXISTS idx_ai_prompts_author_id ON public.ai_prompts(author_id);

-- Update RLS policies to allow authors to manage their own AI providers
-- Drop old restrictive policies first
DROP POLICY IF EXISTS "No direct selects on ai_providers" ON public.ai_providers;
DROP POLICY IF EXISTS "No direct inserts on ai_providers" ON public.ai_providers;
DROP POLICY IF EXISTS "No direct updates on ai_providers" ON public.ai_providers;
DROP POLICY IF EXISTS "No direct deletes on ai_providers" ON public.ai_providers;

-- Create service role policy first (highest priority) - use IF NOT EXISTS equivalent
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ai_providers' 
    AND policyname = 'Service role can manage all AI providers'
  ) THEN
    CREATE POLICY "Service role can manage all AI providers" ON public.ai_providers
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Create author policies (these only apply when not service role)
DROP POLICY IF EXISTS "Authors can view own AI providers" ON public.ai_providers;
CREATE POLICY "Authors can view own AI providers" ON public.ai_providers
  FOR SELECT USING (author_id = auth.jwt()->>'sub');

DROP POLICY IF EXISTS "Authors can insert own AI providers" ON public.ai_providers;
CREATE POLICY "Authors can insert own AI providers" ON public.ai_providers
  FOR INSERT WITH CHECK (author_id = auth.jwt()->>'sub');

DROP POLICY IF EXISTS "Authors can update own AI providers" ON public.ai_providers;
CREATE POLICY "Authors can update own AI providers" ON public.ai_providers
  FOR UPDATE USING (author_id = auth.jwt()->>'sub')
  WITH CHECK (author_id = auth.jwt()->>'sub');

DROP POLICY IF EXISTS "Authors can delete own AI providers" ON public.ai_providers;
CREATE POLICY "Authors can delete own AI providers" ON public.ai_providers
  FOR DELETE USING (author_id = auth.jwt()->>'sub');

-- Update RLS policies to allow authors to manage their own AI prompts
-- Drop old restrictive policies first
DROP POLICY IF EXISTS "No direct selects on ai_prompts" ON public.ai_prompts;
DROP POLICY IF EXISTS "No direct inserts on ai_prompts" ON public.ai_prompts;
DROP POLICY IF EXISTS "No direct updates on ai_prompts" ON public.ai_prompts;
DROP POLICY IF EXISTS "No direct deletes on ai_prompts" ON public.ai_prompts;

-- Create service role policy first (highest priority) - use IF NOT EXISTS equivalent
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ai_prompts' 
    AND policyname = 'Service role can manage all AI prompts'
  ) THEN
    CREATE POLICY "Service role can manage all AI prompts" ON public.ai_prompts
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Create author policies (these only apply when not service role)
DROP POLICY IF EXISTS "Authors can view own AI prompts" ON public.ai_prompts;
CREATE POLICY "Authors can view own AI prompts" ON public.ai_prompts
  FOR SELECT USING (author_id = auth.jwt()->>'sub');

DROP POLICY IF EXISTS "Authors can insert own AI prompts" ON public.ai_prompts;
CREATE POLICY "Authors can insert own AI prompts" ON public.ai_prompts
  FOR INSERT WITH CHECK (author_id = auth.jwt()->>'sub');

DROP POLICY IF EXISTS "Authors can update own AI prompts" ON public.ai_prompts;
CREATE POLICY "Authors can update own AI prompts" ON public.ai_prompts
  FOR UPDATE USING (author_id = auth.jwt()->>'sub')
  WITH CHECK (author_id = auth.jwt()->>'sub');

DROP POLICY IF EXISTS "Authors can delete own AI prompts" ON public.ai_prompts;
CREATE POLICY "Authors can delete own AI prompts" ON public.ai_prompts
  FOR DELETE USING (author_id = auth.jwt()->>'sub');
