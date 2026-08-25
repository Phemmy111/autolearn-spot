-- ALEX AI-Driven Orchestration: Plan Persistence
-- This migration adds AutomationPlan persistence to enable AI-driven orchestration

-- Add automation_plan column to alex_artifact_builds
ALTER TABLE alex_artifact_builds 
ADD COLUMN IF NOT EXISTS automation_plan JSONB;

-- Add index for plan queries
CREATE INDEX IF NOT EXISTS idx_alex_artifact_builds_automation_plan ON alex_artifact_builds USING GIN (automation_plan);

-- Add orchestration_metadata column to track orchestration decisions
ALTER TABLE alex_artifact_builds 
ADD COLUMN IF NOT EXISTS orchestration_metadata JSONB;

-- Add last_orchestration_action column to track the last AI decision
ALTER TABLE alex_artifact_builds 
ADD COLUMN IF NOT EXISTS last_orchestration_action VARCHAR(50);

-- Add index for orchestration action queries
CREATE INDEX IF NOT EXISTS idx_alex_artifact_builds_last_action ON alex_artifact_builds(last_orchestration_action);

-- Add comment for documentation
COMMENT ON COLUMN alex_artifact_builds.automation_plan IS 'AI-driven AutomationPlan - sparse, evolving plan representation';
COMMENT ON COLUMN alex_artifact_builds.orchestration_metadata IS 'Orchestration metadata including previous decisions, context, and reasoning';
COMMENT ON COLUMN alex_artifact_builds.last_orchestration_action IS 'Last AI orchestration action: respond, clarify, recommend, brainstorm, plan, generate, execute, revise';