-- ALEX Phase 3A - File Upload and Document Intelligence Foundation
-- This migration creates the infrastructure for receiving, storing, and processing user files
-- as conversational context for ALEX.

-- ============================================================
-- STORAGE BUCKET CREATION
-- ============================================================

-- Create private storage bucket for ALEX files
-- User-scoped, private access only via authenticated server-side requests
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'alex-files',
  'alex-files',
  false, -- Private bucket (no public URLs)
  20971520, -- 20 MB limit
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'text/markdown',
    'text/javascript',
    'application/javascript',
    'text/typescript',
    'application/typescript',
    'text/css',
    'text/html',
    'application/json',
    'text/x-python',
    'text/x-java-source',
    'text/x-c',
    'text/x-c++',
    'text/x-csharp',
    'text/csv'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ALEX FILES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS alex_files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL, -- Clerk user ID
  conversation_id UUID REFERENCES alex_conversations(id) ON DELETE CASCADE,
  original_filename VARCHAR(255) NOT NULL,
  storage_path TEXT NOT NULL, -- Storage bucket path
  mime_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL, -- Size in bytes
  status VARCHAR(20) DEFAULT 'uploaded', -- 'uploaded', 'processing', 'ready', 'failed'
  extraction_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  extraction_error TEXT,
  extracted_text TEXT, -- Extracted textual content
  page_count INTEGER, -- For PDFs where applicable
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional file metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- User file lookup
CREATE INDEX IF NOT EXISTS idx_alex_files_user_id ON alex_files(user_id);

-- Conversation file lookup
CREATE INDEX IF NOT EXISTS idx_alex_files_conversation_id ON alex_files(conversation_id);

-- Status filtering
CREATE INDEX IF NOT EXISTS idx_alex_files_status ON alex_files(status);

-- Extraction status filtering
CREATE INDEX IF NOT EXISTS idx_alex_files_extraction_status ON alex_files(extraction_status);

-- Created at ordering
CREATE INDEX IF NOT EXISTS idx_alex_files_created_at ON alex_files(created_at DESC);

-- Composite index for user conversation files
CREATE INDEX IF NOT EXISTS idx_alex_files_user_conversation ON alex_files(user_id, conversation_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on alex_files
ALTER TABLE alex_files ENABLE ROW LEVEL SECURITY;

-- Users can view their own files
CREATE POLICY "Users can view own files" ON alex_files
  FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

-- Users can create their own files
CREATE POLICY "Users can create own files" ON alex_files
  FOR INSERT WITH CHECK (user_id = auth.jwt() ->> 'sub');

-- Users can update their own files
CREATE POLICY "Users can update own files" ON alex_files
  FOR UPDATE USING (user_id = auth.jwt() ->> 'sub');

-- Users can delete their own files
CREATE POLICY "Users can delete own files" ON alex_files
  FOR DELETE USING (user_id = auth.jwt() ->> 'sub');

-- Admins have read-only access to all files for monitoring/support
CREATE POLICY "Admins can read all files" ON alex_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE email = auth.jwt() ->> 'email'
      AND is_active = true
    )
  );

-- ============================================================
-- STORAGE POLICIES
-- ============================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload to alex-files" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own alex-files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own alex-files" ON storage.objects;

-- Allow authenticated users to upload
-- Authorization is handled at API route level
CREATE POLICY "Authenticated users can upload to alex-files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'alex-files'
  AND auth.role() = 'authenticated'
);

-- Allow users to read their own files (for server-side signed URL generation)
CREATE POLICY "Users can read own alex-files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'alex-files'
  AND auth.role() = 'authenticated'
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own alex-files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'alex-files'
  AND auth.role() = 'authenticated'
);

-- ============================================================
-- TRIGGER FOR UPDATED_AT
-- ============================================================

CREATE TRIGGER update_alex_files_updated_at
  BEFORE UPDATE ON alex_files
  FOR EACH ROW
  EXECUTE FUNCTION update_alex_updated_at();

-- ============================================================
-- FUNCTION FOR STORAGE PATH GENERATION
-- ============================================================

-- Function to generate storage path based on user and conversation
CREATE OR REPLACE FUNCTION generate_alex_file_path(
  p_user_id VARCHAR(255),
  p_conversation_id UUID,
  p_file_id UUID,
  p_filename VARCHAR(255)
) RETURNS TEXT AS $$
DECLARE
  safe_filename TEXT;
BEGIN
  -- Sanitize filename
  safe_filename := regexp_replace(p_filename, '[^a-zA-Z0-9._-]', '_', 'g');
  
  -- Generate path: alex/{userId}/{conversationId}/{fileId}/{filename}
  RETURN 'alex/' || p_user_id || '/' || p_conversation_id || '/' || p_file_id || '/' || safe_filename;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE 'ALEX Phase 3A file system migration completed successfully';
  RAISE NOTICE 'Storage bucket: alex-files (private, 20MB limit)';
  RAISE NOTICE 'Table: alex_files with RLS policies';
  RAISE NOTICE 'Prepared for future RAG system';
END $$;
