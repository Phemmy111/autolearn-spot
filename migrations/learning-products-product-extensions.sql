-- Phase 3: Extend learning_products with product fields and status
-- Add columns (if they don't already exist)
ALTER TABLE public.learning_products
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'NGN',
  ADD COLUMN IF NOT EXISTS access_duration_days INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT DEFAULT NULL;

-- Indexes for fast lookup (status, author)
CREATE INDEX IF NOT EXISTS idx_learning_products_status ON public.learning_products(status);
CREATE INDEX IF NOT EXISTS idx_learning_products_author_id ON public.learning_products(author_id);

-- RLS policies (authors can select/insert/update their own products in DRAFT/UNPUBLISHED)
-- SELECT: authors can view their own products regardless of status, plus published products via existing policy
DROP POLICY IF EXISTS "Authors can view own products" ON public.learning_products;
CREATE POLICY "Authors can view own products" ON public.learning_products
  FOR SELECT USING (
    auth.jwt()->>'sub' = author_id
  );

-- INSERT: only DRAFT status allowed for authors
DROP POLICY IF EXISTS "Authors can insert own products" ON public.learning_products;
CREATE POLICY "Authors can insert own products" ON public.learning_products
  FOR INSERT WITH CHECK (
    auth.jwt()->>'sub' = author_id AND status = 'DRAFT'
  );

-- UPDATE: authors can update only their own products when status is DRAFT or UNPUBLISHED
DROP POLICY IF EXISTS "Authors can update own products" ON public.learning_products;
CREATE POLICY "Authors can update own products" ON public.learning_products
  FOR UPDATE USING (
    auth.jwt()->>'sub' = author_id AND status IN ('DRAFT', 'UNPUBLISHED')
  ) WITH CHECK (
    auth.jwt()->>'sub' = author_id AND status IN ('DRAFT', 'UNPUBLISHED')
  );

-- Admin policy already exists (super_admin/admin) – keep unchanged.

-- Note: No change to slug uniqueness; slug column remains globally unique from Phase 1.
