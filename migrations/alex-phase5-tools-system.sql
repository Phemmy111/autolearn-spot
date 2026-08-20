-- Phase 5: Tools & Workflows System
-- Tool execution tracking and auditing

-- Enable pgvector if not already enabled (from Phase 3B)
CREATE EXTENSION IF NOT EXISTS vector;

-- Tool execution tracking table
CREATE TABLE IF NOT EXISTS alex_tool_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  conversation_id VARCHAR(255),
  tool_call_id VARCHAR(255) NOT NULL,
  tool_name VARCHAR(100) NOT NULL,
  arguments JSONB NOT NULL,
  success BOOLEAN NOT NULL,
  result JSONB,
  error TEXT,
  execution_time_ms INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_alex_tool_executions_user_id ON alex_tool_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_alex_tool_executions_conversation_id ON alex_tool_executions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_alex_tool_executions_tool_name ON alex_tool_executions(tool_name);
CREATE INDEX IF NOT EXISTS idx_alex_tool_executions_tool_call_id ON alex_tool_executions(tool_call_id);
CREATE INDEX IF NOT EXISTS idx_alex_tool_executions_created_at ON alex_tool_executions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alex_tool_executions_user_created ON alex_tool_executions(user_id, created_at DESC);

-- Row-Level Security Policies
ALTER TABLE alex_tool_executions ENABLE ROW LEVEL SECURITY;

-- Users can view their own tool executions
CREATE POLICY "Users can view own tool executions"
  ON alex_tool_executions
  FOR SELECT
  USING (user_id::text = auth.uid()::text);

-- Users can insert their own tool executions
CREATE POLICY "Users can insert own tool executions"
  ON alex_tool_executions
  FOR INSERT
  WITH CHECK (user_id::text = auth.uid()::text);

-- Admins can view all tool executions (for monitoring)
CREATE POLICY "Admins can view all tool executions"
  ON alex_tool_executions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Comments for documentation
COMMENT ON TABLE alex_tool_executions IS 'Tracks tool executions for auditing and debugging';
COMMENT ON COLUMN alex_tool_executions.user_id IS 'Clerk user ID who executed the tool';
COMMENT ON COLUMN alex_tool_executions.conversation_id IS 'Associated conversation ID (optional)';
COMMENT ON COLUMN alex_tool_executions.tool_call_id IS 'Unique identifier for this tool call';
COMMENT ON COLUMN alex_tool_executions.tool_name IS 'Name of the tool that was executed';
COMMENT ON COLUMN alex_tool_executions.arguments IS 'Arguments passed to the tool (JSONB)';
COMMENT ON COLUMN alex_tool_executions.success IS 'Whether the tool execution succeeded';
COMMENT ON COLUMN alex_tool_executions.result IS 'Tool result if successful (JSONB)';
COMMENT ON COLUMN alex_tool_executions.error IS 'Error message if failed';
COMMENT ON COLUMN alex_tool_executions.execution_time_ms IS 'Execution time in milliseconds';
COMMENT ON COLUMN alex_tool_executions.created_at IS 'Timestamp of tool execution';
