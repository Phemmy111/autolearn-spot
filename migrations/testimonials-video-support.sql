-- Testimonial Video Support Migration
-- Extend testimonials table to support video media

-- ============================================
-- 1. ADD NEW COLUMNS
-- ============================================

-- Add media_type column (default 'image' for existing records)
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'image';

-- Add thumbnail_url column for video posters
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- ============================================
-- 2. MIGRATE EXISTING DATA
-- ============================================

-- Set media_type to 'image' for all existing records that have it as NULL
UPDATE testimonials SET media_type = 'image' WHERE media_type IS NULL;

-- ============================================
-- 3. ADD CONSTRAINTS
-- ============================================

-- Ensure media_type is either 'image' or 'video'
ALTER TABLE testimonials ADD CONSTRAINT check_media_type 
  CHECK (media_type IN ('image', 'video'));

-- ============================================
-- 4. STORAGE BUCKET UPDATE
-- ============================================

-- Update storage bucket to ensure video formats are allowed
-- (already includes video/mp4 and video/webm, but updating to be explicit)
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
WHERE id = 'admin-media';
