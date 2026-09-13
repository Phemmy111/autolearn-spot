-- Phase C: Add YouTube support and lesson status to lessons table
-- This enables the curriculum/lesson builder for Author Studio

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
