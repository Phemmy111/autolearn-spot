-- ALEX AI-Driven Orchestration: Question Persistence
-- This migration adds persistent question tracking to enable cross-request question prevention

-- Create orchestration questions table
CREATE TABLE IF NOT EXISTS alex_orchestration_questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES alex_conversations(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  build_id UUID REFERENCES alex_artifact_builds(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  question_context TEXT,
  question_type VARCHAR(50) DEFAULT 'clarify', -- 'clarify', 'recommend', 'brainstorm'
  answer TEXT,
  answered_at TIMESTAMP WITH TIME ZONE,
  is_answered BOOLEAN DEFAULT false,
  relevance_status VARCHAR(50) DEFAULT 'active', -- 'active', 'resolved', 'obsolete'
  orchestration_action VARCHAR(50), -- The action type when this question was asked
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for question queries
CREATE INDEX IF NOT EXISTS idx_alex_orchestration_questions_conversation_id ON alex_orchestration_questions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_alex_orchestration_questions_user_id ON alex_orchestration_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_alex_orchestration_questions_build_id ON alex_orchestration_questions(build_id);
CREATE INDEX IF NOT EXISTS idx_alex_orchestration_questions_is_answered ON alex_orchestration_questions(is_answered);
CREATE INDEX IF NOT EXISTS idx_alex_orchestration_questions_relevance ON alex_orchestration_questions(relevance_status);
CREATE INDEX IF NOT EXISTS idx_alex_orchestration_questions_created_at ON alex_orchestration_questions(created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_alex_orchestration_questions_updated_at
  BEFORE UPDATE ON alex_orchestration_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_alex_artifact_updated_at();

-- Row Level Security Policies
ALTER TABLE alex_orchestration_questions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own questions
CREATE POLICY "Users can view own orchestration questions"
  ON alex_orchestration_questions FOR SELECT
  USING (user_id::text = auth.uid()::text);

-- Policy: Users can insert their own questions
CREATE POLICY "Users can insert own orchestration questions"
  ON alex_orchestration_questions FOR INSERT
  WITH CHECK (user_id::text = auth.uid()::text);

-- Policy: Users can update their own questions
CREATE POLICY "Users can update own orchestration questions"
  ON alex_orchestration_questions FOR UPDATE
  USING (user_id::text = auth.uid()::text);

-- Add comments for documentation
COMMENT ON TABLE alex_orchestration_questions IS 'Persistent question tracking for AI-driven orchestration';
COMMENT ON COLUMN alex_orchestration_questions.question_context IS 'Context/reason for asking the question';
COMMENT ON COLUMN alex_orchestration_questions.relevance_status IS 'Whether the question is still relevant: active, resolved, obsolete';
COMMENT ON COLUMN alex_orchestration_questions.orchestration_action IS 'The AI orchestration action when this question was asked';