-- Push Notification Subscriptions Table
-- This table stores web push notification subscriptions for users

-- Drop existing table if it exists to recreate with correct schema
DROP TABLE IF EXISTS push_subscriptions CASCADE;

CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  subscription JSONB NOT NULL,
  user_type VARCHAR(50) NOT NULL, -- 'student' or 'author'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can delete own subscriptions" ON push_subscriptions;

-- Users can read their own subscriptions
CREATE POLICY "Users can read own subscriptions"
  ON push_subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::text);

-- Users can insert their own subscriptions
CREATE POLICY "Users can insert own subscriptions"
  ON push_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

-- Users can update their own subscriptions
CREATE POLICY "Users can update own subscriptions"
  ON push_subscriptions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- Users can delete their own subscriptions
CREATE POLICY "Users can delete own subscriptions"
  ON push_subscriptions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid()::text);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_type ON push_subscriptions(user_type);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_push_subscriptions_updated_at ON push_subscriptions;
CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
