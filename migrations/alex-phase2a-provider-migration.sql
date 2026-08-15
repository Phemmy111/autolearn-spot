-- ALEX Phase 2A Provider Migration
-- This migration supports provider-agnostic architecture with self-hosted model support
-- and multi-provider configuration

-- Enable required extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Modify alex_provider_config table to support new architecture
ALTER TABLE alex_provider_config 
  ALTER COLUMN api_key_encrypted DROP NOT NULL;

-- Add new columns for enhanced provider configuration
ALTER TABLE alex_provider_config 
  ADD COLUMN IF NOT EXISTS provider_endpoint TEXT,
  ADD COLUMN IF NOT EXISTS provider_model VARCHAR(255),
  ADD COLUMN IF NOT EXISTS auth_type VARCHAR(50) DEFAULT 'api_key',
  ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS health_status VARCHAR(50) DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS last_health_check TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS health_latency_ms INTEGER,
  ADD COLUMN IF NOT EXISTS health_error_message TEXT;

-- Add constraints for new columns
-- Drop existing constraints if they exist to avoid conflicts
ALTER TABLE alex_provider_config 
  DROP CONSTRAINT IF EXISTS check_auth_type,
  DROP CONSTRAINT IF EXISTS check_health_status,
  DROP CONSTRAINT IF EXISTS check_priority_positive;

-- Add new constraints
ALTER TABLE alex_provider_config 
  ADD CONSTRAINT check_auth_type 
    CHECK (auth_type IN ('api_key', 'token', 'none', 'custom')),
  ADD CONSTRAINT check_health_status 
    CHECK (health_status IN ('healthy', 'degraded', 'unavailable', 'unknown')),
  ADD CONSTRAINT check_priority_positive 
    CHECK (priority > 0);

-- Update the provider_type enum to include self_hosted
-- First, we need to modify the constraint since we can't directly alter enum types in PostgreSQL
ALTER TABLE alex_provider_config 
  DROP CONSTRAINT IF EXISTS alex_provider_config_provider_type_check;

-- Add the new constraint with self_hosted included
ALTER TABLE alex_provider_config 
  ADD CONSTRAINT alex_provider_config_provider_type_check 
    CHECK (provider_type IN ('self_hosted', 'openrouter', 'openai', 'gemini', 'groq'));

-- Create index for provider priority queries
CREATE INDEX IF NOT EXISTS idx_alex_provider_config_priority 
  ON alex_provider_config(priority) WHERE is_active = true;

-- Create index for health status queries
CREATE INDEX IF NOT EXISTS idx_alex_provider_config_health_status 
  ON alex_provider_config(health_status);

-- Update RLS policies to handle the new architecture
-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view alex provider config" ON alex_provider_config;
DROP POLICY IF EXISTS "Admins can insert alex provider config" ON alex_provider_config;
DROP POLICY IF EXISTS "Admins can update alex provider config" ON alex_provider_config;
DROP POLICY IF EXISTS "Admins can delete alex provider config" ON alex_provider_config;

-- Recreate policies with support for new fields
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

-- Create a function to update provider health status
CREATE OR REPLACE FUNCTION update_provider_health()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_health_check = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for health status updates
DROP TRIGGER IF EXISTS update_provider_health_trigger ON alex_provider_config;
CREATE TRIGGER update_provider_health_trigger
  BEFORE UPDATE OF health_status ON alex_provider_config
  FOR EACH ROW
  EXECUTE FUNCTION update_provider_health();

-- Insert example self-hosted provider configuration (optional, for testing)
-- This is commented out by default - uncomment if needed for testing
/*
INSERT INTO alex_provider_config (
  provider_name, 
  provider_type, 
  api_key_encrypted, 
  provider_endpoint, 
  provider_model,
  auth_type,
  priority,
  cost_controls, 
  is_active
) VALUES (
  'ALEX Self-Hosted', 
  'self_hosted', 
  NULL, 
  'http://localhost:11434/v1', 
  'llama2',
  'none',
  1,
  '{"maxTokens": 4000, "temperature": 0.7, "dailyRequestLimit": 100, "monthlyRequestLimit": 3000}', 
  false
) ON CONFLICT DO NOTHING;
*/

-- Add comment to document the migration
COMMENT ON TABLE alex_provider_config IS 'ALEX provider configuration with support for self-hosted and external providers';
COMMENT ON COLUMN alex_provider_config.api_key_encrypted IS 'Encrypted API key (nullable for self-hosted providers)';
COMMENT ON COLUMN alex_provider_config.provider_endpoint IS 'Endpoint URL for self-hosted providers';
COMMENT ON COLUMN alex_provider_config.provider_model IS 'Model name for the provider';
COMMENT ON COLUMN alex_provider_config.auth_type IS 'Authentication type: api_key, token, none, custom';
COMMENT ON COLUMN alex_provider_config.priority IS 'Provider priority (lower = higher priority)';
COMMENT ON COLUMN alex_provider_config.health_status IS 'Current health status: healthy, degraded, unavailable, unknown';
COMMENT ON COLUMN alex_provider_config.last_health_check IS 'Timestamp of last health check';
COMMENT ON COLUMN alex_provider_config.health_latency_ms IS 'Latency in milliseconds from last health check';
COMMENT ON COLUMN alex_provider_config.health_error_message IS 'Error message from last failed health check';
