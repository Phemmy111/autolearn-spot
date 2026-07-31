-- Badge System Schema Migration
-- This script creates the necessary tables for the badge system

-- Create user_badges table
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  badge_id TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Note: No foreign key to auth.users since we use Clerk authentication
  -- User IDs are Clerk user IDs (text), not Supabase auth UUIDs
  
  -- Ensure each user can only earn each badge once
  CONSTRAINT unique_user_badge UNIQUE (user_id, badge_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_earned_at ON user_badges(earned_at DESC);

-- Enable RLS
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own badges"
  ON user_badges FOR SELECT
  USING (auth.uid()::text = user_id);

-- Note: Admin access is handled at the application level

CREATE POLICY "System can insert badges"
  ON user_badges FOR INSERT
  WITH CHECK (true); -- Allow service role to insert badges

-- Add columns to leaderboard table for detailed scoring breakdown
DO $$
BEGIN
    -- Check if column exists before adding
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'leaderboard' 
        AND column_name = 'assignment_score'
    ) THEN
        ALTER TABLE leaderboard ADD COLUMN assignment_score INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'leaderboard' 
        AND column_name = 'quiz_score'
    ) THEN
        ALTER TABLE leaderboard ADD COLUMN quiz_score INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'leaderboard' 
        AND column_name = 'video_completion'
    ) THEN
        ALTER TABLE leaderboard ADD COLUMN video_completion INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'leaderboard' 
        AND column_name = 'certificate_bonus'
    ) THEN
        ALTER TABLE leaderboard ADD COLUMN certificate_bonus INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'leaderboard' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE leaderboard ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Create index for updated_at if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_leaderboard_updated_at ON leaderboard(updated_at DESC);