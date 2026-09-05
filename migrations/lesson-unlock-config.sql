-- Phase 3: Add unlock configuration to lessons
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS unlock_config JSONB DEFAULT '{}'::jsonb;

-- Index for faster queries (optional)
CREATE INDEX IF NOT EXISTS idx_lessons_unlock_config ON public.lessons USING gin (unlock_config);
