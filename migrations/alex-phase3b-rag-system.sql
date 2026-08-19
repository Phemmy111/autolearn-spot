-- ALEX Phase 3B - RAG System for Semantic Document Retrieval
-- This migration adds semantic indexing and retrieval capabilities to the ALEX file system
-- Building on Phase 3A's extracted text as the authoritative source

-- ============================================================
-- EXTENSION ENABLEMENT
-- ============================================================

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- ALEX FILES TABLE - PHASE 3B ADDITIONS
-- ============================================================

-- Add indexing status tracking to alex_files
ALTER TABLE alex_files 
ADD COLUMN IF NOT EXISTS indexing_status VARCHAR(20) DEFAULT 'not_indexed',
ADD COLUMN IF NOT EXISTS indexing_error TEXT,
ADD COLUMN IF NOT EXISTS indexing_metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS chunk_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_indexed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS embedding_model VARCHAR(100);

-- Add constraint for valid indexing status values
ALTER TABLE alex_files 
ADD CONSTRAINT check_indexing_status 
CHECK (indexing_status IN ('not_indexed', 'indexing', 'indexed', 'failed'));

-- Add constraint for non-negative chunk count
ALTER TABLE alex_files 
ADD CONSTRAINT check_chunk_count 
CHECK (chunk_count >= 0);

-- Create index for indexing status filtering
CREATE INDEX IF NOT EXISTS idx_alex_files_indexing_status ON alex_files(indexing_status);

-- Create index for last indexed at ordering
CREATE INDEX IF NOT EXISTS idx_alex_files_last_indexed_at ON alex_files(last_indexed_at DESC);

-- ============================================================
-- ALEX DOCUMENT CHUNKS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS alex_document_chunks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  file_id UUID NOT NULL REFERENCES alex_files(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  conversation_id UUID REFERENCES alex_conversations(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI text-embedding-3-small dimension
  metadata JSONB DEFAULT '{}'::jsonb,
  embedding_model VARCHAR(100) NOT NULL,
  embedding_dimension INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one chunk per index per file
  UNIQUE(file_id, chunk_index)
);

-- ============================================================
-- CHUNK TABLE INDEXES
-- ============================================================

-- Vector similarity search index using ivfflat
CREATE INDEX IF NOT EXISTS idx_alex_document_chunks_embedding 
ON alex_document_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- File lookup index
CREATE INDEX IF NOT EXISTS idx_alex_document_chunks_file_id 
ON alex_document_chunks(file_id);

-- User lookup index
CREATE INDEX IF NOT EXISTS idx_alex_document_chunks_user_id 
ON alex_document_chunks(user_id);

-- Conversation lookup index
CREATE INDEX IF NOT EXISTS idx_alex_document_chunks_conversation_id 
ON alex_document_chunks(conversation_id);

-- Composite index for user+conversation retrieval
CREATE INDEX IF NOT EXISTS idx_alex_document_chunks_user_conversation 
ON alex_document_chunks(user_id, conversation_id);

-- ============================================================
-- CHUNK TABLE CONSTRAINTS
-- ============================================================

-- Ensure chunk content is not empty
ALTER TABLE alex_document_chunks 
ADD CONSTRAINT check_chunk_content_not_empty 
CHECK (content IS NOT NULL AND length(trim(content)) > 0);

-- Ensure embedding is not NULL
ALTER TABLE alex_document_chunks 
ADD CONSTRAINT check_embedding_not_null 
CHECK (embedding IS NOT NULL);

-- Ensure embedding dimension is positive
ALTER TABLE alex_document_chunks 
ADD CONSTRAINT check_embedding_dimension_positive 
CHECK (embedding_dimension > 0);

-- Ensure chunk index is non-negative
ALTER TABLE alex_document_chunks 
ADD CONSTRAINT check_chunk_index_non_negative 
CHECK (chunk_index >= 0);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Note: Following ALEX pattern, RLS is disabled for ALEX tables
-- Authorization is handled at API level with Clerk authentication
-- These policies are documented for future reference if RLS is ever enabled

-- Enable RLS on alex_document_chunks (commented out - following ALEX pattern)
-- ALTER TABLE alex_document_chunks ENABLE ROW LEVEL SECURITY;

-- Users can view own chunks (for future RLS enablement)
-- CREATE POLICY "Users can view own chunks" ON alex_document_chunks
--   FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

-- System can insert chunks (for indexing operations)
-- CREATE POLICY "System can insert chunks" ON alex_document_chunks
--   FOR INSERT WITH CHECK (true);

-- System can update chunks (for re-indexing operations)
-- CREATE POLICY "System can update chunks" ON alex_document_chunks
--   FOR UPDATE WITH CHECK (true);

-- System can delete chunks (for cleanup operations)
-- CREATE POLICY "System can delete chunks" ON alex_document_chunks
--   FOR DELETE USING (true);

-- Admins can read all chunks (for monitoring/support)
-- CREATE POLICY "Admins can read all chunks" ON alex_document_chunks
--   FOR SELECT USING (
--     EXISTS (
--       SELECT 1 FROM admins 
--       WHERE email = auth.jwt() ->> 'email'
--       AND is_active = true
--     )
--   );

-- ============================================================
-- VECTOR SIMILARITY SEARCH FUNCTION
-- ============================================================

-- Function to perform semantic similarity search for document chunks
CREATE OR REPLACE FUNCTION match_document_chunks(
  p_query_embedding vector(1536),
  p_user_id VARCHAR(255),
  p_conversation_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 10,
  p_min_similarity FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  chunk_id UUID,
  file_id UUID,
  user_id VARCHAR(255),
  conversation_id UUID,
  chunk_index INTEGER,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    adc.id as chunk_id,
    adc.file_id,
    adc.user_id,
    adc.conversation_id,
    adc.chunk_index,
    adc.content,
    adc.metadata,
    1 - (adc.embedding <=> p_query_embedding) as similarity
  FROM alex_document_chunks adc
  WHERE adc.user_id = p_user_id
    AND (p_conversation_id IS NULL OR adc.conversation_id = p_conversation_id)
    AND (1 - (adc.embedding <=> p_query_embedding)) >= p_min_similarity
  ORDER BY adc.embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- INDEXING HELPER FUNCTIONS
-- ============================================================

-- Function to update file indexing metadata
CREATE OR REPLACE FUNCTION update_indexing_metadata(
  p_file_id UUID,
  p_status VARCHAR(20),
  p_error TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE alex_files
  SET 
    indexing_status = p_status,
    indexing_error = p_error,
    indexing_metadata = COALESCE(p_metadata, indexing_metadata),
    last_indexed_at = CASE WHEN p_status = 'indexed' THEN NOW() ELSE last_indexed_at END
  WHERE id = p_file_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get chunk count for a file
CREATE OR REPLACE FUNCTION get_file_chunk_count(p_file_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) 
    FROM alex_document_chunks 
    WHERE file_id = p_file_id
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE 'ALEX Phase 3B RAG system migration completed successfully';
  RAISE NOTICE 'Added indexing columns to alex_files';
  RAISE NOTICE 'Created alex_document_chunks table with vector support';
  RAISE NOTICE 'Created vector similarity search function: match_document_chunks()';
  RAISE NOTICE 'Enabled pgvector extension for semantic search';
  RAISE NOTICE 'Prepared for semantic document retrieval';
END $$;
