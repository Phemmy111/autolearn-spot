-- Phase 6: Agent System
-- Controlled multi-step agent execution tracking

-- Agent execution tracking table
CREATE TABLE IF NOT EXISTS alex_agent_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id VARCHAR(255) UNIQUE NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  conversation_id VARCHAR(255),
  status VARCHAR(50) NOT NULL,
  step_count INTEGER NOT NULL DEFAULT 0,
  tool_call_count INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  error TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_alex_agent_executions_user_id ON alex_agent_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_alex_agent_executions_conversation_id ON alex_agent_executions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_alex_agent_executions_execution_id ON alex_agent_executions(execution_id);
CREATE INDEX IF NOT EXISTS idx_alex_agent_executions_status ON alex_agent_executions(status);
CREATE INDEX IF NOT EXISTS idx_alex_agent_executions_started_at ON alex_agent_executions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_alex_agent_executions_user_started ON alex_agent_executions(user_id, started_at DESC);

-- Row-Level Security Policies
ALTER TABLE alex_agent_executions ENABLE ROW LEVEL SECURITY;

-- Users can view their own agent executions
CREATE POLICY "Users can view own agent executions"
  ON alex_agent_executions
  FOR SELECT
  USING (user_id::text = auth.uid()::text);

-- Users can insert their own agent executions
CREATE POLICY "Users can insert own agent executions"
  ON alex_agent_executions
  FOR INSERT
  WITH CHECK (user_id::text = auth.uid()::text);

-- Users can update their own agent executions
CREATE POLICY "Users can update own agent executions"
  ON alex_agent_executions
  FOR UPDATE
  USING (user_id::text = auth.uid()::text);

-- Admins can view all agent executions (for monitoring)
CREATE POLICY "Admins can view all agent executions"
  ON alex_agent_executions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Comments for documentation
COMMENT ON TABLE alex_agent_executions IS 'Tracks controlled multi-step agent executions';
COMMENT ON COLUMN alex_agent_executions.execution_id IS 'Unique identifier for this agent execution';
COMMENT ON COLUMN alex_agent_executions.user_id IS 'Clerk user ID who initiated the agent';
COMMENT ON COLUMN alex_agent_executions.conversation_id IS 'Associated conversation ID (optional)';
COMMENT ON COLUMN alex_agent_executions.status IS 'Execution status: planning, executing, waiting, completed, failed, cancelled, limit_reached';
COMMENT ON COLUMN alex_agent_executions.step_count IS 'Number of steps executed';
COMMENT ON COLUMN alex_agent_executions.tool_call_count IS 'Number of tool calls made';
COMMENT ON COLUMN alex_agent_executions.started_at IS 'Timestamp when execution started';
COMMENT ON COLUMN alex_agent_executions.completed_at IS 'Timestamp when execution completed';
COMMENT ON COLUMN alex_agent_executions.error IS 'Error message if execution failed';
COMMENT ON COLUMN alex_agent_executions.metadata IS 'Additional execution metadata (JSONB)';
