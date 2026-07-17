-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create AI providers table (must be created first as it's referenced by ai_usage_logs)
CREATE TABLE IF NOT EXISTS ai_providers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL, -- e.g., "My OpenRouter", "Production OpenAI"
  provider_type VARCHAR(50) NOT NULL, -- 'openrouter', 'openai', 'gemini', 'groq'
  api_key_encrypted TEXT NOT NULL, -- Encrypted API key
  base_url TEXT, -- Custom base URL if needed
  default_model VARCHAR(255), -- Default model for this provider
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false, -- Whether this is the default provider
  models JSONB, -- Cached list of available models
  last_model_fetch TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(255) -- Clerk user ID of who created this provider
);

-- Create unique constraint to ensure only one default provider
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_providers_default ON ai_providers(is_default) WHERE is_default = true;

-- Create AI prompts table
CREATE TABLE IF NOT EXISTS ai_prompts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  prompt_type VARCHAR(100) NOT NULL, -- 'quiz_generation', 'general', etc.
  content TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(255), -- Clerk user ID
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by VARCHAR(255) -- Clerk user ID
);

-- Create unique constraint to ensure only one active prompt per type
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_prompts_active_type ON ai_prompts(prompt_type, is_active) WHERE is_active = true;

-- Create AI usage logs table (now can reference ai_providers)
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_user_id VARCHAR(255), -- Clerk user ID
  provider_id UUID REFERENCES ai_providers(id) ON DELETE SET NULL,
  provider_name VARCHAR(100),
  provider_type VARCHAR(50),
  model VARCHAR(255),
  prompt TEXT,
  response_time_ms INTEGER,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  tokens_used INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for usage logs
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at ON ai_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_admin_user ON ai_usage_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_provider_id ON ai_usage_logs(provider_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_success ON ai_usage_logs(success);

-- Create AI cost controls table
CREATE TABLE IF NOT EXISTS ai_cost_controls (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  max_tokens INTEGER DEFAULT 4000,
  temperature DECIMAL(3,2) DEFAULT 0.7,
  daily_request_limit INTEGER DEFAULT 100,
  monthly_request_limit INTEGER DEFAULT 3000,
  max_retries INTEGER DEFAULT 3,
  request_timeout_ms INTEGER DEFAULT 30000,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(50) NOT NULL DEFAULT 'admin', -- 'super_admin' or 'admin'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(255), -- Clerk user ID of who created this admin
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  week_number INTEGER NOT NULL,
  phase VARCHAR(50) NOT NULL, -- WEEK_1, WEEK_2, etc.
  time_limit INTEGER, -- in minutes
  passing_score INTEGER DEFAULT 70, -- percentage
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) DEFAULT 'multiple_choice', -- multiple_choice, true_false, short_answer
  options JSONB, -- for multiple choice: ["A", "B", "C", "D"]
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  points INTEGER DEFAULT 1,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quiz_responses table
CREATE TABLE IF NOT EXISTS quiz_responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL, -- Clerk user ID
  user_name VARCHAR(255),
  user_email VARCHAR(255),
  answers JSONB NOT NULL, -- {question_id: answer}
  score INTEGER NOT NULL,
  total_points INTEGER NOT NULL,
  percentage INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  time_taken INTEGER, -- in seconds
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create leaderboard table
CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL UNIQUE, -- Clerk user ID
  user_name VARCHAR(255) NOT NULL,
  user_email VARCHAR(255),
  total_score INTEGER DEFAULT 0,
  quizzes_completed INTEGER DEFAULT 0,
  quizzes_passed INTEGER DEFAULT 0,
  average_score DECIMAL(5,2) DEFAULT 0,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_providers_type ON ai_providers(provider_type);
CREATE INDEX IF NOT EXISTS idx_ai_providers_is_active ON ai_providers(is_active);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_role ON admins(role);
CREATE INDEX IF NOT EXISTS idx_admins_is_active ON admins(is_active);
CREATE INDEX IF NOT EXISTS idx_quizzes_week ON quizzes(week_number);
CREATE INDEX IF NOT EXISTS idx_quizzes_phase ON quizzes(phase);
CREATE INDEX IF NOT EXISTS idx_quizzes_is_active ON quizzes(is_active);
CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_questions_order ON questions(quiz_id, order_index);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_quiz_id ON quiz_responses(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_user_id ON quiz_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_user_quiz ON quiz_responses(user_id, quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_completed_at ON quiz_responses(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_user_id ON leaderboard(user_id);

-- Enable Row Level Security
ALTER TABLE ai_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_cost_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- SECURITY NOTE: All write operations (INSERT, UPDATE, DELETE) are protected at the API route level
-- using server-side admin checks. RLS policies here are configured to be restrictive by default.

-- AI Prompts policies (restricted - only service role can manage)
CREATE POLICY "No direct inserts on ai_prompts" ON ai_prompts
  FOR INSERT WITH CHECK (false);

CREATE POLICY "No direct updates on ai_prompts" ON ai_prompts
  FOR UPDATE USING (false);

CREATE POLICY "No direct deletes on ai_prompts" ON ai_prompts
  FOR DELETE USING (false);

CREATE POLICY "No direct selects on ai_prompts" ON ai_prompts
  FOR SELECT USING (false);

-- AI Usage Logs policies (restricted - only service role can manage)
CREATE POLICY "No direct inserts on ai_usage_logs" ON ai_usage_logs
  FOR INSERT WITH CHECK (false);

CREATE POLICY "No direct updates on ai_usage_logs" ON ai_usage_logs
  FOR UPDATE USING (false);

CREATE POLICY "No direct deletes on ai_usage_logs" ON ai_usage_logs
  FOR DELETE USING (false);

CREATE POLICY "No direct selects on ai_usage_logs" ON ai_usage_logs
  FOR SELECT USING (false);

-- AI Cost Controls policies (restricted - only service role can manage)
CREATE POLICY "No direct inserts on ai_cost_controls" ON ai_cost_controls
  FOR INSERT WITH CHECK (false);

CREATE POLICY "No direct updates on ai_cost_controls" ON ai_cost_controls
  FOR UPDATE USING (false);

CREATE POLICY "No direct deletes on ai_cost_controls" ON ai_cost_controls
  FOR DELETE USING (false);

CREATE POLICY "No direct selects on ai_cost_controls" ON ai_cost_controls
  FOR SELECT USING (false);

-- AI Providers policies (restricted - only service role can manage)
CREATE POLICY "No direct inserts on ai_providers" ON ai_providers
  FOR INSERT WITH CHECK (false);

CREATE POLICY "No direct updates on ai_providers" ON ai_providers
  FOR UPDATE USING (false);

CREATE POLICY "No direct deletes on ai_providers" ON ai_providers
  FOR DELETE USING (false);

CREATE POLICY "No direct selects on ai_providers" ON ai_providers
  FOR SELECT USING (false);

-- Admins policies (restricted - only service role can manage)
CREATE POLICY "No direct inserts on admins" ON admins
  FOR INSERT WITH CHECK (false);

CREATE POLICY "No direct updates on admins" ON admins
  FOR UPDATE USING (false);

CREATE POLICY "No direct deletes on admins" ON admins
  FOR DELETE USING (false);

CREATE POLICY "No direct selects on admins" ON admins
  FOR SELECT USING (false);

-- Quizzes policies
CREATE POLICY "Public can view active quizzes" ON quizzes
  FOR SELECT USING (is_active = true);

CREATE POLICY "No direct inserts on quizzes" ON quizzes
  FOR INSERT WITH CHECK (false);

CREATE POLICY "No direct updates on quizzes" ON quizzes
  FOR UPDATE USING (false);

CREATE POLICY "No direct deletes on quizzes" ON quizzes
  FOR DELETE USING (false);

-- Questions policies
CREATE POLICY "Public can view questions for active quizzes" ON questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quizzes 
      WHERE quizzes.id = questions.quiz_id 
      AND quizzes.is_active = true
    )
  );

CREATE POLICY "No direct inserts on questions" ON questions
  FOR INSERT WITH CHECK (false);

CREATE POLICY "No direct updates on questions" ON questions
  FOR UPDATE USING (false);

CREATE POLICY "No direct deletes on questions" ON questions
  FOR DELETE USING (false);

-- Quiz responses policies
CREATE POLICY "Users can view own responses" ON quiz_responses
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own responses" ON quiz_responses
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "No direct updates on quiz_responses" ON quiz_responses
  FOR UPDATE USING (false);

CREATE POLICY "No direct deletes on quiz_responses" ON quiz_responses
  FOR DELETE USING (false);

-- Leaderboard policies
CREATE POLICY "Public can view leaderboard" ON leaderboard
  FOR SELECT USING (true);

CREATE POLICY "No direct inserts on leaderboard" ON leaderboard
  FOR INSERT WITH CHECK (false);

CREATE POLICY "No direct updates on leaderboard" ON leaderboard
  FOR UPDATE USING (false);

CREATE POLICY "No direct deletes on leaderboard" ON leaderboard
  FOR DELETE USING (false);

-- Create a function that bypasses RLS for service role operations
-- This is used by the leaderboard trigger which runs with service role privileges
CREATE OR REPLACE FUNCTION update_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
  -- This function runs with service role privileges, bypassing RLS
  INSERT INTO leaderboard (user_id, user_name, user_email, total_score, quizzes_completed, quizzes_passed, average_score, last_activity, updated_at)
  VALUES (
    NEW.user_id,
    NEW.user_name,
    NEW.user_email,
    NEW.score,
    1,
    CASE WHEN NEW.passed THEN 1 ELSE 0 END,
    NEW.percentage::DECIMAL,
    NEW.completed_at,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_score = leaderboard.total_score + NEW.score,
    quizzes_completed = leaderboard.quizzes_completed + 1,
    quizzes_passed = leaderboard.quizzes_passed + CASE WHEN NEW.passed THEN 1 ELSE 0 END,
    average_score = (
      (leaderboard.average_score * leaderboard.quizzes_completed + NEW.percentage) / 
      (leaderboard.quizzes_completed + 1)
    ),
    last_activity = NEW.completed_at,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function
CREATE TRIGGER trigger_update_leaderboard
  AFTER INSERT ON quiz_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_leaderboard();

-- Seed initial super admin
INSERT INTO admins (email, role, is_active, created_by)
VALUES ('femiadeleke2020@gmail.com', 'super_admin', true, NULL)
ON CONFLICT (email) DO NOTHING;

-- Seed initial cost controls
INSERT INTO ai_cost_controls (max_tokens, temperature, daily_request_limit, monthly_request_limit, max_retries, request_timeout_ms, enabled)
VALUES (4000, 0.7, 100, 3000, 3, 30000, true)
ON CONFLICT DO NOTHING;
