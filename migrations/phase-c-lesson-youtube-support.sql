-- Phase C: Add YouTube support and lesson status to lessons table
-- This enables the curriculum/lesson builder for Author Studio

-- ALTERNATIVE APPROACH: Add a UUID primary key while keeping existing structure
-- This avoids breaking existing data and constraints

-- Step 1: Add a new UUID column as the true primary key
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS uuid_id UUID DEFAULT uuid_generate_v4();

-- Step 2: Populate the uuid_id for existing records
UPDATE public.lessons SET uuid_id = uuid_generate_v4() WHERE uuid_id IS NULL;

-- Step 3: Make uuid_id NOT NULL
ALTER TABLE public.lessons ALTER COLUMN uuid_id SET NOT NULL;

-- Step 4: Drop the foreign key constraint that depends on lessons_pkey
ALTER TABLE public.lesson_progress DROP CONSTRAINT IF EXISTS lesson_progress_cohort_id_lesson_id_fkey;

-- Step 5: Drop the unique constraint that also depends on the old structure
ALTER TABLE public.lesson_progress DROP CONSTRAINT IF EXISTS lesson_progress_cohort_id_lesson_id_user_id_key;

-- Step 5.5: Drop the lesson_uuid_id foreign key if it exists (from previous failed migration)
ALTER TABLE public.lesson_progress DROP CONSTRAINT IF EXISTS lesson_progress_lesson_uuid_id_fkey;

-- Step 6: Drop the existing composite primary key
ALTER TABLE public.lessons DROP CONSTRAINT lessons_pkey;

-- Step 7: Add uuid_id as the new primary key
ALTER TABLE public.lessons ADD CONSTRAINT lessons_pkey PRIMARY KEY (uuid_id);

-- Step 8: Make cohort_id nullable
ALTER TABLE public.lessons
  ALTER COLUMN cohort_id DROP NOT NULL;

-- Step 8.5: Make cohort-specific fields nullable for product-based lessons
ALTER TABLE public.lessons
  ALTER COLUMN week_number DROP NOT NULL,
  ALTER COLUMN session_number DROP NOT NULL,
  ALTER COLUMN release_day DROP NOT NULL;

-- Step 9: Add a UUID column to lesson_progress to reference the new primary key
ALTER TABLE public.lesson_progress ADD COLUMN IF NOT EXISTS lesson_uuid_id UUID;

-- Step 10: Populate lesson_uuid_id by joining with lessons table
-- Only populate if it's null (in case of re-running migration)
UPDATE public.lesson_progress lp
SET lesson_uuid_id = l.uuid_id
FROM public.lessons l
WHERE lp.lesson_uuid_id IS NULL AND lp.lesson_id = l.id AND lp.cohort_id = l.cohort_id;

-- Step 11: Make lesson_uuid_id NOT NULL
ALTER TABLE public.lesson_progress ALTER COLUMN lesson_uuid_id SET NOT NULL;

-- Step 12: Recreate the foreign key constraint on lesson_progress
-- Updated to reference the new uuid_id primary key
ALTER TABLE public.lesson_progress 
  ADD CONSTRAINT IF NOT EXISTS lesson_progress_lesson_uuid_id_fkey 
  FOREIGN KEY (lesson_uuid_id) REFERENCES public.lessons(uuid_id) ON DELETE CASCADE;

-- Step 13: Recreate the unique constraint without cohort_id
-- Now it's just (lesson_uuid_id, user_id) to ensure a user can only have one progress record per lesson
ALTER TABLE public.lesson_progress 
  ADD CONSTRAINT IF NOT EXISTS lesson_progress_lesson_uuid_id_user_id_key 
  UNIQUE (lesson_uuid_id, user_id);

-- Add YouTube-specific fields
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS youtube_url TEXT,
  ADD COLUMN IF NOT EXISTS youtube_video_id TEXT,
  ADD COLUMN IF NOT EXISTS youtube_thumbnail TEXT;

-- Add lesson status for draft/published management
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED'));

-- Add is_required flag for unlock configuration
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS is_required BOOLEAN NOT NULL DEFAULT true;

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_lessons_product_id_status ON public.lessons(product_id, status);
CREATE INDEX IF NOT EXISTS idx_lessons_youtube_video_id ON public.lessons(youtube_video_id);

-- Update RLS policies for author lesson management
-- Authors can select lessons for their own products
DROP POLICY IF EXISTS "Authors can view lessons for own products" ON public.lessons;
CREATE POLICY "Authors can view lessons for own products" ON public.lessons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.learning_products
      WHERE learning_products.id = lessons.product_id
      AND learning_products.author_id = auth.jwt()->>'sub'
    )
  );

-- Authors can insert lessons for their own products (only DRAFT status)
DROP POLICY IF EXISTS "Authors can insert lessons for own products" ON public.lessons;
CREATE POLICY "Authors can insert lessons for own products" ON public.lessons
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.learning_products
      WHERE learning_products.id = lessons.product_id
      AND learning_products.author_id = auth.jwt()->>'sub'
      AND learning_products.status IN ('DRAFT', 'UNPUBLISHED')
    )
    AND status = 'DRAFT'
  );

-- Authors can update lessons for their own products
DROP POLICY IF EXISTS "Authors can update lessons for own products" ON public.lessons;
CREATE POLICY "Authors can update lessons for own products" ON public.lessons
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.learning_products
      WHERE learning_products.id = lessons.product_id
      AND learning_products.author_id = auth.jwt()->>'sub'
      AND learning_products.status IN ('DRAFT', 'UNPUBLISHED')
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.learning_products
      WHERE learning_products.id = lessons.product_id
      AND learning_products.author_id = auth.jwt()->>'sub'
      AND learning_products.status IN ('DRAFT', 'UNPUBLISHED')
    )
  );

-- Authors can delete lessons for their own products
DROP POLICY IF EXISTS "Authors can delete lessons for own products" ON public.lessons;
CREATE POLICY "Authors can delete lessons for own products" ON public.lessons
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.learning_products
      WHERE learning_products.id = lessons.product_id
      AND learning_products.author_id = auth.jwt()->>'sub'
      AND learning_products.status IN ('DRAFT', 'UNPUBLISHED')
    )
  );

-- Keep existing admin policies (they should still work)
