-- ============================================================================
-- AUTOLEARN SPOT: ADMINS & ALEX COMPLETE DATABASE SETUP
-- Project: tjvgonysradvjybwjhsn
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ADMINS TABLE
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(50) NOT NULL DEFAULT 'admin', -- 'super_admin' or 'admin'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(255),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Femi Adeleke as Super Admin
INSERT INTO public.admins (email, role, is_active)
VALUES 
  ('femiadeleke2020@gmail.com', 'super_admin', true),
  ('femi@autolearnspot.com', 'super_admin', true),
  ('marvellousomobomi@gmail.com', 'super_admin', true)
ON CONFLICT (email) 
DO UPDATE SET 
  role = EXCLUDED.role,
  is_active = true,
  updated_at = NOW();

-- 2. ALEX PROVIDER CONFIG
CREATE TABLE IF NOT EXISTS public.alex_provider_config (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  provider_name VARCHAR(100) NOT NULL,
  display_name VARCHAR(100),
  provider_type VARCHAR(50) NOT NULL CHECK (provider_type IN ('self_hosted', 'groq', 'openrouter', 'gemini', 'openai', 'openai_compatible')),
  api_key_encrypted TEXT NOT NULL DEFAULT '',
  base_url TEXT,
  current_model VARCHAR(255) DEFAULT 'llama-3.3-70b-versatile',
  priority INTEGER DEFAULT 1,
  health_status VARCHAR(20) DEFAULT 'healthy' CHECK (health_status IN ('healthy', 'degraded', 'unavailable', 'unknown')),
  fallback_enabled BOOLEAN DEFAULT true,
  is_vision_fallback BOOLEAN DEFAULT false,
  capabilities JSONB DEFAULT '["chat", "code", "workflow", "vision"]'::jsonb,
  request_timeout INTEGER DEFAULT 30000,
  auth_type VARCHAR(20) DEFAULT 'bearer' CHECK (auth_type IN ('bearer', 'none', 'api_key', 'custom')),
  models JSONB DEFAULT '["llama-3.3-70b-versatile", "gemini-2.0-flash", "gpt-4o-mini"]'::jsonb,
  cost_controls JSONB DEFAULT '{"max_daily_usd": 10}'::jsonb,
  model_list_metadata JSONB DEFAULT '{}'::jsonb,
  last_health_check TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  latency_ms INTEGER DEFAULT 120,
  health_error TEXT,
  failure_count INTEGER DEFAULT 0,
  consecutive_failure_count INTEGER DEFAULT 0,
  last_success_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Default Active Provider (Groq / OpenRouter / Gemini compatible)
INSERT INTO public.alex_provider_config (
  provider_name,
  display_name,
  provider_type,
  current_model,
  priority,
  health_status,
  is_active,
  fallback_enabled,
  auth_type,
  api_key_encrypted
) VALUES (
  'Groq Llama 3.3 70B (Primary)',
  'Groq Llama 3.3 70B',
  'groq',
  'llama-3.3-70b-versatile',
  1,
  'healthy',
  true,
  true,
  'bearer',
  ''
) ON CONFLICT DO NOTHING;

-- 3. ALEX CONVERSATIONS
CREATE TABLE IF NOT EXISTS public.alex_conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  mode VARCHAR(50) NOT NULL DEFAULT 'auto',
  title VARCHAR(255) DEFAULT 'New Learning Session',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alex_conversations_user ON public.alex_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_alex_conversations_created ON public.alex_conversations(created_at DESC);

-- 4. ALEX MESSAGES
CREATE TABLE IF NOT EXISTS public.alex_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.alex_conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  tokens INTEGER DEFAULT 0,
  model_used VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alex_messages_conv ON public.alex_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_alex_messages_created ON public.alex_messages(created_at DESC);

-- 5. ALEX USAGE TRACKING
CREATE TABLE IF NOT EXISTS public.alex_usage (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  conversation_id UUID REFERENCES public.alex_conversations(id) ON DELETE SET NULL,
  model VARCHAR(255) NOT NULL,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  estimated_cost DECIMAL(10,6) DEFAULT 0.0,
  mode VARCHAR(50) DEFAULT 'tutor',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alex_usage_user ON public.alex_usage(user_id);

-- 6. ALEX FILES & DOCUMENT CHUNKS
CREATE TABLE IF NOT EXISTS public.alex_files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100),
  file_size INTEGER,
  storage_path TEXT,
  extracted_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.alex_document_chunks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  file_id UUID REFERENCES public.alex_files(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. ALEX MEMORIES
CREATE TABLE IF NOT EXISTS public.alex_memories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  memory_type VARCHAR(50) NOT NULL DEFAULT 'preference',
  key VARCHAR(255) NOT NULL,
  value TEXT NOT NULL,
  confidence DECIMAL(3,2) DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alex_memories_user ON public.alex_memories(user_id);

-- 8. ALEX ARTIFACT BUILDS & ARTIFACTS
CREATE TABLE IF NOT EXISTS public.alex_artifact_builds (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  conversation_id UUID REFERENCES public.alex_conversations(id) ON DELETE CASCADE,
  original_request TEXT NOT NULL,
  artifact_type VARCHAR(50) DEFAULT 'workflow',
  status VARCHAR(50) DEFAULT 'collecting_requirements',
  requirements JSONB DEFAULT '{}'::jsonb,
  architecture_plan JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.alex_artifacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  build_id UUID REFERENCES public.alex_artifact_builds(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  artifact_type VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  json_data JSONB,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.alex_artifact_questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  build_id UUID REFERENCES public.alex_artifact_builds(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  field_name VARCHAR(100) NOT NULL,
  options JSONB,
  answer TEXT,
  answered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.alex_orchestration_questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES public.alex_conversations(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  field_key VARCHAR(100),
  options JSONB,
  response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. ALEX AGENT & TOOL EXECUTIONS
CREATE TABLE IF NOT EXISTS public.alex_agent_executions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  agent_name VARCHAR(100) NOT NULL,
  task_description TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'running',
  result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.alex_tool_executions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tool_name VARCHAR(100) NOT NULL,
  input_params JSONB,
  output_result JSONB,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. DISABLE RLS ON SERVICE-MANAGED BACKEND TABLES TO PREVENT ACCESS BLOCKS
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alex_provider_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alex_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alex_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alex_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alex_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alex_document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alex_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alex_artifact_builds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alex_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alex_artifact_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alex_orchestration_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alex_agent_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alex_tool_executions ENABLE ROW LEVEL SECURITY;

-- Allow service_role to do EVERYTHING on all public tables
DROP POLICY IF EXISTS "Service role full access on admins" ON public.admins;
CREATE POLICY "Service role full access on admins" ON public.admins FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on alex_provider_config" ON public.alex_provider_config;
CREATE POLICY "Service role full access on alex_provider_config" ON public.alex_provider_config FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on alex_conversations" ON public.alex_conversations;
CREATE POLICY "Service role full access on alex_conversations" ON public.alex_conversations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on alex_messages" ON public.alex_messages;
CREATE POLICY "Service role full access on alex_messages" ON public.alex_messages FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on alex_usage" ON public.alex_usage;
CREATE POLICY "Service role full access on alex_usage" ON public.alex_usage FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on alex_files" ON public.alex_files;
CREATE POLICY "Service role full access on alex_files" ON public.alex_files FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on alex_document_chunks" ON public.alex_document_chunks;
CREATE POLICY "Service role full access on alex_document_chunks" ON public.alex_document_chunks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on alex_memories" ON public.alex_memories;
CREATE POLICY "Service role full access on alex_memories" ON public.alex_memories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on alex_artifact_builds" ON public.alex_artifact_builds;
CREATE POLICY "Service role full access on alex_artifact_builds" ON public.alex_artifact_builds FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on alex_artifacts" ON public.alex_artifacts;
CREATE POLICY "Service role full access on alex_artifacts" ON public.alex_artifacts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on alex_artifact_questions" ON public.alex_artifact_questions;
CREATE POLICY "Service role full access on alex_artifact_questions" ON public.alex_artifact_questions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on alex_orchestration_questions" ON public.alex_orchestration_questions;
CREATE POLICY "Service role full access on alex_orchestration_questions" ON public.alex_orchestration_questions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on alex_agent_executions" ON public.alex_agent_executions;
CREATE POLICY "Service role full access on alex_agent_executions" ON public.alex_agent_executions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on alex_tool_executions" ON public.alex_tool_executions;
CREATE POLICY "Service role full access on alex_tool_executions" ON public.alex_tool_executions FOR ALL USING (true) WITH CHECK (true);
