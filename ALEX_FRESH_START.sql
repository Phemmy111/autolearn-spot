-- ALEX Provider Fresh Start - Using Quiz System as Template
-- This completely replaces the broken ALEX system with the proven working quiz approach

-- 1. Drop the broken ALEX table and recreate it with the quiz system structure
DROP TABLE IF EXISTS alex_provider_config CASCADE;

-- 2. Create fresh table matching quiz system structure
CREATE TABLE alex_provider_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name VARCHAR(100) NOT NULL,
  display_name VARCHAR(100),
  provider_type VARCHAR(50) NOT NULL CHECK (provider_type IN ('self_hosted', 'groq', 'openrouter', 'gemini', 'openai', 'openai_compatible')),
  api_key_encrypted TEXT,
  base_url TEXT,
  current_model VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1,
  health_status VARCHAR(20) DEFAULT 'unknown',
  fallback_enabled BOOLEAN DEFAULT true,
  auth_type VARCHAR(20) DEFAULT 'bearer',
  request_timeout INTEGER DEFAULT 30000,
  capabilities JSONB DEFAULT '[]'::jsonb,
  model_list_metadata JSONB DEFAULT '{}'::jsonb,
  last_health_check TIMESTAMP WITH TIME ZONE,
  latency_ms INTEGER,
  health_error TEXT,
  last_success_at TIMESTAMP WITH TIME ZONE,
  failure_count INTEGER DEFAULT 0,
  consecutive_failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID
);

-- 3. Add indexes
CREATE INDEX idx_alex_provider_config_priority ON alex_provider_config(priority) WHERE is_active = true;
CREATE INDEX idx_alex_provider_config_health ON alex_provider_config(health_status) WHERE is_active = true;
CREATE INDEX idx_alex_provider_config_type ON alex_provider_config(provider_type);

-- 4. Add check constraints
ALTER TABLE alex_provider_config
ADD CONSTRAINT check_health_status CHECK (health_status IN ('healthy', 'degraded', 'unavailable', 'unknown')),
ADD CONSTRAINT check_auth_type CHECK (auth_type IN ('bearer', 'none', 'api_key', 'custom'));

-- 5. Add update trigger
CREATE OR REPLACE FUNCTION update_alex_provider_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_alex_provider_config_updated_at
  BEFORE UPDATE ON alex_provider_config
  FOR EACH ROW
  EXECUTE FUNCTION update_alex_provider_config_updated_at();

-- 6. Insert the Groq provider with the working configuration
INSERT INTO alex_provider_config (
  provider_name,
  display_name,
  provider_type,
  base_url,
  current_model,
  is_active,
  priority,
  fallback_enabled,
  auth_type,
  request_timeout,
  capabilities,
  health_status
) VALUES (
  'ALEX Primary Provider',
  'Groq AI Provider',
  'groq',
  'https://api.groq.com/openai/v1',
  'llama3-70b-8192',
  true,
  1,
  true,
  'bearer',
  30000,
  '["streaming"]'::jsonb,
  'unknown'
);

-- 7. Success message
SELECT 'ALEX Provider table recreated successfully. Now set your API key using the UI or emergency endpoint.' as status;
