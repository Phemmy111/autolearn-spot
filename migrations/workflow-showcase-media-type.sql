-- Workflow Showcase Media Type Migration
-- Add media_type column to support both image and video workflow showcases

-- ============================================
-- 1. ADD MEDIA_TYPE COLUMN
-- ============================================

ALTER TABLE workflow_showcase ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'video';

-- ============================================
-- 2. ADD CONSTRAINT
-- ============================================

-- Ensure media_type is either 'image' or 'video'
ALTER TABLE workflow_showcase ADD CONSTRAINT check_media_type 
  CHECK (media_type IN ('image', 'video'));

-- ============================================
-- 3. MIGRATE EXISTING DATA
-- ============================================

-- Set media_type to 'video' for all existing records (they were all videos originally)
UPDATE workflow_showcase SET media_type = 'video' WHERE media_type IS NULL;
