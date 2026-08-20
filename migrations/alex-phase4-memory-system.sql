-- ALEX Phase 4 - Memory System for Persistent User Memory
-- This migration creates the infrastructure for storing and retrieving
-- persistent user memories across conversations.

-- ============================================================
-- EXTENSION VERIFICATION
-- ============================================================

-- Ensure pgvector extension is enabled (should already exist from Phase 3B)
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- ALEX MEMORIES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS alex_memories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL, -- Clerk user ID
  memory_type VARCHAR(50) NOT NULL, -- 'preference', 'fact', 'instruction'
  content TEXT NOT NULL, -- The memory content
  embedding vector(1536), -- For semantic retrieval (reuse RAG dimension)
  embedding_model VARCHAR(100), -- Track which model generated embedding
  embedding_dimension INTEGER NOT NULL, -- Should be 1536
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional structured data
  source VARCHAR(100) NOT NULL DEFAULT 'explicit', -- 'explicit', 'inferred', 'system'
  source_conversation_id UUID REFERENCES alex_conversations(id) ON DELETE SET NULL,
  confidence DECIMAL(3,2) DEFAULT 1.0, -- 0.0 to 1.0
  importance DECIMAL(3,2) DEFAULT 0.5, -- 0.0 to 1.0 for ranking
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  access_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT check_memory_type CHECK (memory_type IN ('preference', 'fact', 'instruction')),
  CONSTRAINT check_confidence CHECK (confidence >= 0 AND confidence <= 1),
  CONSTRAINT check_importance CHECK (importance >= 0 AND importance <= 1),
  CONSTRAINT check_source CHECK (source IN ('explicit', 'inferred', 'system')),
  CONSTRAINT check_embedding_dimension_positive CHECK (embedding_dimension > 0)
);

-- ============================================================
-- INDEXES
-- ============================================================

-- User lookup index
CREATE INDEX IF NOT EXISTS idx_alex_memories_user_id ON alex_memories(user_id);

-- Memory type filtering
CREATE INDEX IF NOT EXISTS idx_alex_memories_type ON alex_memories(memory_type);

-- Active memories index
CREATE INDEX IF NOT EXISTS idx_alex_memories_active ON alex_memories(is_active) WHERE is_active = true;

-- Last accessed ordering for recency
CREATE INDEX IF NOT EXISTS idx_alex_memories_last_accessed ON alex_memories(last_accessed_at DESC);

-- Importance ranking
CREATE INDEX IF NOT EXISTS idx_alex_memories_importance ON alex_memories(importance DESC);

-- Composite index for user + active filtering
CREATE INDEX IF NOT EXISTS idx_alex_memories_user_active ON alex_memories(user_id, is_active);

-- Source conversation lookup
CREATE INDEX IF NOT EXISTS idx_alex_memories_source_conversation ON alex_memories(source_conversation_id);

-- ============================================================
-- VECTOR SIMILARITY SEARCH INDEX
-- ============================================================

-- Vector similarity search index using ivfflat (reuse RAG pattern)
CREATE INDEX IF NOT EXISTS idx_alex_memories_embedding 
ON alex_memories 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on alex_memories (following ALEX pattern)
ALTER TABLE alex_memories ENABLE ROW LEVEL SECURITY;

-- Users can view their own memories
CREATE POLICY "Users can view own memories" ON alex_memories
  FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

-- Users can create their own memories
CREATE POLICY "Users can create own memories" ON alex_memories
  FOR INSERT WITH CHECK (user_id = auth.jwt() ->> 'sub');

-- Users can update their own memories
CREATE POLICY "Users can update own memories" ON alex_memories
  FOR UPDATE USING (user_id = auth.jwt() ->> 'sub');

-- Users can delete their own memories
CREATE POLICY "Users can delete own memories" ON alex_memories
  FOR DELETE USING (user_id = auth.jwt() ->> 'sub');

-- Admins have read-only access to all memories for monitoring/support
CREATE POLICY "Admins can read all memories" ON alex_memories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE email = auth.jwt() ->> 'email'
      AND is_active = true
    )
  );

-- ============================================================
-- MEMORY SIMILARITY SEARCH FUNCTION
-- ============================================================

-- Function to perform semantic similarity search for memories
CREATE OR REPLACE FUNCTION match_memories(
  p_query_embedding vector(1536),
  p_user_id VARCHAR(255),
  p_memory_types VARCHAR(50)[], -- Optional type filter
  p_limit INTEGER DEFAULT 10,
  p_min_similarity FLOAT DEFAULT 0.7,
  p_min_importance FLOAT DEFAULT 0.0
)
RETURNS TABLE (
  memory_id UUID,
  user_id VARCHAR(255),
  memory_type VARCHAR(50),
  content TEXT,
  metadata JSONB,
  similarity FLOAT,
  importance DECIMAL(3,2),
  confidence DECIMAL(3,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    am.id as memory_id,
    am.user_id,
    am.memory_type,
    am.content,
    am.metadata,
    1 - (am.embedding <=> p_query_embedding) as similarity,
    am.importance,
    am.confidence
  FROM alex_memories am
  WHERE am.user_id = p_user_id
    AND am.is_active = true
    AND (p_memory_types IS NULL OR am.memory_type = ANY(p_memory_types))
    AND am.importance >= p_min_importance
    AND (1 - (am.embedding <=> p_query_embedding)) >= p_min_similarity
  ORDER BY 
    (1 - (am.embedding <=> p_query_embedding)) DESC, -- Similarity
    am.importance DESC, -- Importance
    am.last_accessed_at ASC -- Recency (less accessed gets priority)
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- MEMORY ACCESS TRACKING FUNCTION
-- ============================================================

-- Function to update memory access statistics
CREATE OR REPLACE FUNCTION update_memory_access(p_memory_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE alex_memories
  SET 
    last_accessed_at = NOW(),
    access_count = COALESCE(access_count, 0) + 1
  WHERE id = p_memory_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGER FOR UPDATED_AT
-- ============================================================

-- Trigger to automatically update updated_at timestamp
CREATE TRIGGER update_alex_memories_updated_at
  BEFORE UPDATE ON alex_memories
  FOR EACH ROW
  EXECUTE FUNCTION update_alex_updated_at();

-- ============================================================
-- SUCCESS MESSAGE
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE 'ALEX Phase 4 memory system migration completed successfully';
  RAISE NOTICE 'Created alex_memories table with vector support';
  RAISE NOTICE 'Created memory similarity search function: match_memories()';
  RAISE NOTICE 'Created memory access tracking function: update_memory_access()';
  RAISE NOTICE 'Enabled RLS policies for user-scoped memory access';
  RAISE NOTICE 'Prepared for persistent user memory across conversations';
END $$;
