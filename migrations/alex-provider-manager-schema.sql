-- ALEX Provider Manager Schema Migration
-- Adds fields for multi-provider management, health monitoring, and fallback

-- Add new columns to alex_provider_config (without CHECK constraints first)
ALTER TABLE alex_provider_config
ADD COLUMN IF NOT EXISTS display_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS health_status VARCHAR(20) DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS last_health_check TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS latency_ms INTEGER,
ADD COLUMN IF NOT EXISTS health_error TEXT,
ADD COLUMN IF NOT EXISTS fallback_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS capabilities JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS request_timeout INTEGER DEFAULT 30000,
ADD COLUMN IF NOT EXISTS model_list_metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS last_success_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS failure_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS consecutive_failure_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_model VARCHAR(255),
ADD COLUMN IF NOT EXISTS auth_type VARCHAR(20) DEFAULT 'bearer';

-- Add indexes for provider management
CREATE INDEX IF NOT EXISTS idx_alex_provider_config_priority ON alex_provider_config(priority) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_alex_provider_config_health ON alex_provider_config(health_status) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_alex_provider_config_type ON alex_provider_config(provider_type);

-- Update existing records to have default values
UPDATE alex_provider_config
SET 
  display_name = provider_name,
  priority = 1,
  health_status = 'unknown',
  fallback_enabled = true,
  auth_type = CASE 
    WHEN provider_type = 'self_hosted' THEN 'none'
    WHEN auth_type IS NULL OR auth_type = '' THEN 'bearer'
    ELSE auth_type
  END
WHERE display_name IS NULL OR auth_type IS NULL;

-- Drop existing constraints if they exist (for re-running migration)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_health_status' 
        AND conrelid = 'alex_provider_config'::regclass
    ) THEN
        ALTER TABLE alex_provider_config DROP CONSTRAINT check_health_status;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_auth_type' 
        AND conrelid = 'alex_provider_config'::regclass
    ) THEN
        ALTER TABLE alex_provider_config DROP CONSTRAINT check_auth_type;
    END IF;
END $$;

-- Now add CHECK constraints (after data is valid)
ALTER TABLE alex_provider_config
ADD CONSTRAINT check_health_status CHECK (health_status IN ('healthy', 'degraded', 'unavailable', 'unknown')),
ADD CONSTRAINT check_auth_type CHECK (auth_type IN ('bearer', 'none', 'api_key', 'custom'));

-- Create a function to update consecutive failure count
CREATE OR REPLACE FUNCTION increment_provider_failure()
RETURNS TRIGGER AS $$
BEGIN
  NEW.failure_count = COALESCE(OLD.failure_count, 0) + 1;
  NEW.consecutive_failure_count = COALESCE(OLD.consecutive_failure_count, 0) + 1;
  NEW.health_status = CASE 
    WHEN NEW.consecutive_failure_count >= 3 THEN 'unavailable'
    WHEN NEW.consecutive_failure_count >= 1 THEN 'degraded'
    ELSE NEW.health_status
  END;
  NEW.last_health_check = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a function to reset failure count on success
CREATE OR REPLACE FUNCTION reset_provider_failure()
RETURNS TRIGGER AS $$
BEGIN
  NEW.failure_count = COALESCE(OLD.failure_count, 0);
  NEW.consecutive_failure_count = 0;
  NEW.health_status = 'healthy';
  NEW.last_success_at = NOW();
  NEW.last_health_check = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: Triggers would be created on provider update operations
-- These would be called by the provider manager when health checks occur

-- Backfill current_model from models JSON if not set
UPDATE alex_provider_config
SET current_model = CASE 
  WHEN current_model IS NULL AND models IS NOT NULL THEN 
    (models->>'default')::text
  ELSE current_model
END
WHERE current_model IS NULL;
