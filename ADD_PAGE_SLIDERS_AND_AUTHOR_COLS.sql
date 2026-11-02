-- ========================================================
-- 1. EXTEND AUTHORS TABLE (Supports both clerk_user_id & user_id)
-- ========================================================
ALTER TABLE public.authors ADD COLUMN IF NOT EXISTS clerk_user_id VARCHAR(255);
ALTER TABLE public.authors ADD COLUMN IF NOT EXISTS display_name VARCHAR(255);
ALTER TABLE public.authors ADD COLUMN IF NOT EXISTS profile_image TEXT;
ALTER TABLE public.authors ADD COLUMN IF NOT EXISTS professional_title VARCHAR(255);
ALTER TABLE public.authors ADD COLUMN IF NOT EXISTS years_of_experience INTEGER;
ALTER TABLE public.authors ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE public.authors ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE public.authors ADD COLUMN IF NOT EXISTS linkedin_profile TEXT;
ALTER TABLE public.authors ADD COLUMN IF NOT EXISTS website_portfolio TEXT;
ALTER TABLE public.authors ADD COLUMN IF NOT EXISTS expertise TEXT[];
ALTER TABLE public.authors ADD COLUMN IF NOT EXISTS cv_url TEXT;
ALTER TABLE public.authors ADD COLUMN IF NOT EXISTS portfolio_samples_url TEXT;
ALTER TABLE public.authors ADD COLUMN IF NOT EXISTS id_document_url TEXT;

-- Backfill display_name and profile_image from existing name and avatar_url
UPDATE public.authors 
SET 
  display_name = COALESCE(display_name, name),
  profile_image = COALESCE(profile_image, avatar_url),
  clerk_user_id = COALESCE(clerk_user_id, user_id)
WHERE clerk_user_id IS NULL OR display_name IS NULL;

-- ========================================================
-- 2. EXTEND PROFILES TABLE
-- ========================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name VARCHAR(255);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_image TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS professional_title VARCHAR(255);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- ========================================================
-- 3. CREATE PAGE SLIDERS & SLIDER MEDIA TABLES
-- ========================================================
CREATE TABLE IF NOT EXISTS public.page_sliders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  target_id VARCHAR(255) NOT NULL UNIQUE,
  transition_style VARCHAR(50) DEFAULT 'fade',
  duration_ms INTEGER DEFAULT 5000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.slider_media (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slider_id UUID NOT NULL REFERENCES public.page_sliders(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type VARCHAR(50) DEFAULT 'image',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS for admin sliders
ALTER TABLE public.page_sliders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.slider_media DISABLE ROW LEVEL SECURITY;

-- ========================================================
-- 4. INSERT HOMEPAGE MEDIA SLIDER
-- ========================================================
INSERT INTO public.page_sliders (id, target_id, transition_style, duration_ms)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'homepage',
  'fade',
  5000
) ON CONFLICT (target_id) DO UPDATE SET
  transition_style = EXCLUDED.transition_style,
  duration_ms = EXCLUDED.duration_ms;

INSERT INTO public.slider_media (slider_id, media_url, media_type, order_index)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=2069&auto=format&fit=crop', 'image', 0),
  ('11111111-1111-1111-1111-111111111111', '/videos/workflow.mp4', 'video', 1),
  ('11111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=2070&auto=format&fit=crop', 'image', 2),
  ('11111111-1111-1111-1111-111111111111', '/workflow-real.jpg', 'image', 3)
ON CONFLICT DO NOTHING;
