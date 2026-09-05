-- Phase 3: Link lessons to learning products
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.learning_products(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_lessons_product_id ON public.lessons(product_id);
