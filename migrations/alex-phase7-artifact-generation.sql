-- ALEX Phase 7: Artifact Generation System
-- This schema enables ALEX to generate, validate, and persist downloadable artifacts

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean up existing tables and policies (for re-running migration)
DROP TABLE IF EXISTS alex_artifact_questions CASCADE;
DROP TABLE IF EXISTS alex_artifacts CASCADE;
DROP TABLE IF EXISTS alex_artifact_builds CASCADE;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_alex_artifact_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Artifact Builds Table - Tracks build workflows
CREATE TABLE IF NOT EXISTS alex_artifact_builds (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES alex_conversations(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  build_type VARCHAR(50) NOT NULL, -- 'chatbot', 'workflow', 'agent', 'configuration', 'project'
  status VARCHAR(50) NOT NULL DEFAULT 'collecting_requirements', -- 'collecting_requirements', 'ready_for_confirmation', 'confirmed', 'generating', 'validating', 'persisting', 'completed', 'failed'
  original_request TEXT NOT NULL,
  final_specification JSONB, -- Final agreed specification
  requirements_collected JSONB, -- Collected requirements
  missing_requirements JSONB, -- Requirements still needed
  confirmation_granted BOOLEAN DEFAULT false,
  generation_metadata JSONB, -- Generation timing, retry counts, etc.
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger for updated_at
CREATE TRIGGER update_alex_artifact_builds_updated_at
  BEFORE UPDATE ON alex_artifact_builds
  FOR EACH ROW
  EXECUTE FUNCTION update_alex_artifact_updated_at();

-- Create indexes for build queries
CREATE INDEX IF NOT EXISTS idx_alex_artifact_builds_conversation_id ON alex_artifact_builds(conversation_id);
CREATE INDEX IF NOT EXISTS idx_alex_artifact_builds_user_id ON alex_artifact_builds(user_id);
CREATE INDEX IF NOT EXISTS idx_alex_artifact_builds_status ON alex_artifact_builds(status);
CREATE INDEX IF NOT EXISTS idx_alex_artifact_builds_created_at ON alex_artifact_builds(created_at DESC);

-- Generated Artifacts Table - Stores actual generated files
CREATE TABLE IF NOT EXISTS alex_artifacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  build_id UUID NOT NULL REFERENCES alex_artifact_builds(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL, -- 'json', 'md', 'txt', 'js', 'py', etc.
  mime_type VARCHAR(100) NOT NULL,
  content TEXT NOT NULL, -- File content (for text-based files)
  storage_path TEXT, -- For binary files stored in Supabase Storage
  file_size INTEGER,
  validation_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'valid', 'invalid', 'failed'
  validation_errors JSONB,
  is_primary BOOLEAN DEFAULT false, -- Main artifact vs supplementary
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger for updated_at
CREATE TRIGGER update_alex_artifacts_updated_at
  BEFORE UPDATE ON alex_artifacts
  FOR EACH ROW
  EXECUTE FUNCTION update_alex_artifact_updated_at();

-- Create indexes for artifact queries
CREATE INDEX IF NOT EXISTS idx_alex_artifacts_build_id ON alex_artifacts(build_id);
CREATE INDEX IF NOT EXISTS idx_alex_artifacts_user_id ON alex_artifacts(user_id);
CREATE INDEX IF NOT EXISTS idx_alex_artifacts_validation_status ON alex_artifacts(validation_status);
CREATE INDEX IF NOT EXISTS idx_alex_artifacts_created_at ON alex_artifacts(created_at DESC);

-- Artifact Requirement Questions Table - Tracks questions asked during requirement gathering
CREATE TABLE IF NOT EXISTS alex_artifact_questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  build_id UUID NOT NULL REFERENCES alex_artifact_builds(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  question_type VARCHAR(50) NOT NULL, -- 'missing_requirement', 'clarification', 'verification'
  answer TEXT,
  answered_at TIMESTAMP WITH TIME ZONE,
  is_answered BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for question queries
CREATE INDEX IF NOT EXISTS idx_alex_artifact_questions_build_id ON alex_artifact_questions(build_id);
CREATE INDEX IF NOT EXISTS idx_alex_artifact_questions_is_answered ON alex_artifact_questions(is_answered);

-- Row Level Security Policies
ALTER TABLE alex_artifact_builds ENABLE ROW LEVEL SECURITY;
ALTER TABLE alex_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alex_artifact_questions ENABLE ROW LEVEL SECURITY;

-- Artifact Builds RLS
CREATE POLICY "Users can view own artifact builds" ON alex_artifact_builds
  FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can create own artifact builds" ON alex_artifact_builds
  FOR INSERT WITH CHECK (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update own artifact builds" ON alex_artifact_builds
  FOR UPDATE USING (user_id = auth.jwt() ->> 'sub');

-- Artifacts RLS
CREATE POLICY "Users can view own artifacts" ON alex_artifacts
  FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can create own artifacts" ON alex_artifacts
  FOR INSERT WITH CHECK (user_id = auth.jwt() ->> 'sub');

-- Questions RLS
CREATE POLICY "Users can view own artifact questions" ON alex_artifact_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM alex_artifact_builds 
      WHERE alex_artifact_builds.id = alex_artifact_questions.build_id
      AND alex_artifact_builds.user_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Users can create own artifact questions" ON alex_artifact_questions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM alex_artifact_builds 
      WHERE alex_artifact_builds.id = alex_artifact_questions.build_id
      AND alex_artifact_builds.user_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Users can update own artifact questions" ON alex_artifact_questions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM alex_artifact_builds 
      WHERE alex_artifact_builds.id = alex_artifact_questions.build_id
      AND alex_artifact_builds.user_id = auth.jwt() ->> 'sub'
    )
  );
