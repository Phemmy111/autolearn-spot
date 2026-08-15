-- ALEX Phase 1 Core Schema
-- This creates the independent ALEX system with dedicated provider configuration
-- following the ALEX Master Specification v1.0

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ALEX Provider Configuration Table
-- Independent from existing ai_providers table for ALEX-specific usage
CREATE TABLE IF NOT EXISTS alex_provider_config (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  provider_name VARCHAR(100) NOT NULL, -- e.g., "ALEX Primary Provider"
  provider_type VARCHAR(50) NOT NULL, -- 'openrouter', 'openai', 'gemini', 'groq'
  api_key_encrypted TEXT NOT NULL, -- Encrypted API key for ALEX
  base_url TEXT, -- Custom base URL if needed
  models JSONB, -- Available models for different capabilities
  cost_controls JSONB, -- ALEX-specific cost controls
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for active provider lookup
CREATE INDEX IF NOT EXISTS idx_alex_provider_config_active ON alex_provider_config(is_active) WHERE is_active = true;

-- ALEX Conversations Table
CREATE TABLE IF NOT EXISTS alex_conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL, -- Clerk user ID
  mode VARCHAR(50) NOT NULL, -- 'auto', 'tutor', 'developer', 'automation', 'research', 'agent_builder'
  title VARCHAR(255), -- Auto-generated or user-set title
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for conversation queries
CREATE INDEX IF NOT EXISTS idx_alex_conversations_user_id ON alex_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_alex_conversations_mode ON alex_conversations(mode);
CREATE INDEX IF NOT EXISTS idx_alex_conversations_created_at ON alex_conversations(created_at DESC);

-- ALEX Messages Table
CREATE TABLE IF NOT EXISTS alex_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES alex_conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL, -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  tokens INTEGER, -- Token count for this message
  model_used VARCHAR(255), -- Which model generated this response
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for message queries
CREATE INDEX IF NOT EXISTS idx_alex_messages_conversation_id ON alex_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_alex_messages_created_at ON alex_messages(created_at DESC);

-- ALEX Usage Tracking Table
-- Independent from ai_usage_logs for ALEX-specific cost management
CREATE TABLE IF NOT EXISTS alex_usage (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL, -- Clerk user ID
  conversation_id UUID REFERENCES alex_conversations(id) ON DELETE SET NULL,
  model VARCHAR(255) NOT NULL,
  tokens_used INTEGER NOT NULL,
  estimated_cost DECIMAL(10,6), -- Estimated cost in USD
  mode VARCHAR(50), -- Which mode was used
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for usage analytics
CREATE INDEX IF NOT EXISTS idx_alex_usage_user_id ON alex_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_alex_usage_conversation_id ON alex_usage(conversation_id);
CREATE INDEX IF NOT EXISTS idx_alex_usage_created_at ON alex_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alex_usage_model ON alex_usage(model);

-- Row Level Security Policies

-- Enable RLS on all ALEX tables
ALTER TABLE alex_provider_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE alex_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE alex_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE alex_usage ENABLE ROW LEVEL SECURITY;

-- ALEX Provider Config RLS
-- Only admins can manage provider config
CREATE POLICY "Admins can view alex provider config" ON alex_provider_config
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE email = auth.jwt() ->> 'email'
      AND is_active = true
    )
  );

CREATE POLICY "Admins can insert alex provider config" ON alex_provider_config
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE email = auth.jwt() ->> 'email'
      AND is_active = true
    )
  );

CREATE POLICY "Admins can update alex provider config" ON alex_provider_config
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE email = auth.jwt() ->> 'email'
      AND is_active = true
    )
  );

CREATE POLICY "Admins can delete alex provider config" ON alex_provider_config
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE email = auth.jwt() ->> 'email'
      AND is_active = true
    )
  );

-- ALEX Conversations RLS
-- Users can view their own conversations
CREATE POLICY "Users can view own conversations" ON alex_conversations
  FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

-- Users can create their own conversations
CREATE POLICY "Users can create own conversations" ON alex_conversations
  FOR INSERT WITH CHECK (user_id = auth.jwt() ->> 'sub');

-- Users can update their own conversations
CREATE POLICY "Users can update own conversations" ON alex_conversations
  FOR UPDATE USING (user_id = auth.jwt() ->> 'sub');

-- Users can delete their own conversations
CREATE POLICY "Users can delete own conversations" ON alex_conversations
  FOR DELETE USING (user_id = auth.jwt() ->> 'sub');

-- Admins have read-only access to all conversations for monitoring/support
CREATE POLICY "Admins can read all conversations" ON alex_conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE email = auth.jwt() ->> 'email'
      AND is_active = true
    )
  );

-- ALEX Messages RLS
-- Users can view messages in their own conversations
CREATE POLICY "Users can view own conversation messages" ON alex_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM alex_conversations 
      WHERE alex_conversations.id = alex_messages.conversation_id
      AND alex_conversations.user_id = auth.jwt() ->> 'sub'
    )
  );

-- Users can create messages in their own conversations
CREATE POLICY "Users can create messages in own conversations" ON alex_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM alex_conversations 
      WHERE alex_conversations.id = alex_messages.conversation_id
      AND alex_conversations.user_id = auth.jwt() ->> 'sub'
    )
  );

-- Admins have read-only access to all messages for monitoring/support
CREATE POLICY "Admins can read all messages" ON alex_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE email = auth.jwt() ->> 'email'
      AND is_active = true
    )
  );

-- ALEX Usage RLS
-- Users can view their own usage
CREATE POLICY "Users can view own usage" ON alex_usage
  FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

-- System can create usage records (for AI operations)
CREATE POLICY "System can create usage records" ON alex_usage
  FOR INSERT WITH CHECK (true);

-- Admins can view all usage for analytics
CREATE POLICY "Admins can view all usage" ON alex_usage
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE email = auth.jwt() ->> 'email'
      AND is_active = true
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_alex_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_alex_provider_config_updated_at
  BEFORE UPDATE ON alex_provider_config
  FOR EACH ROW
  EXECUTE FUNCTION update_alex_updated_at();

CREATE TRIGGER update_alex_conversations_updated_at
  BEFORE UPDATE ON alex_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_alex_updated_at();

-- Insert default ALEX provider configuration if none exists
-- This will be configured by admin later, but we create a placeholder
INSERT INTO alex_provider_config (provider_name, provider_type, api_key_encrypted, cost_controls, is_active)
VALUES ('ALEX Default Provider', 'openrouter', 'configure-in-admin', '{"maxTokens": 4000, "temperature": 0.7, "dailyRequestLimit": 100, "monthlyRequestLimit": 3000}', false)
ON CONFLICT DO NOTHING;