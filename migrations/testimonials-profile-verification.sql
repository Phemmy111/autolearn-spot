-- Testimonial Profile/Verification Extension
-- Add profile picture and social profile URL support

-- ============================================
-- 1. ADD NEW COLUMNS
-- ============================================

-- Add profile_image_url column for student profile pictures
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- Add social_profile_url column for verification/social profile links
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS social_profile_url TEXT;

-- ============================================
-- 2. ADD CONSTRAINTS
-- ============================================

-- Ensure social_profile_url starts with http:// or https:// if provided
ALTER TABLE testimonials ADD CONSTRAINT check_social_profile_url 
  CHECK (social_profile_url IS NULL OR social_profile_url = '' OR social_profile_url ~ '^https?://');
