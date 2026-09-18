-- Migration: Extend Notifications for Author Engagement
-- Phase C: Author Engagement Master

-- Extend the existing notifications table if needed
-- Note: The base notifications table should already exist from notifications-schema.sql

-- Create notification_type enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
    CREATE TYPE notification_type AS ENUM (
      'LIVE_CLASS_SCHEDULED',
      'LIVE_CLASS_REMINDER',
      'AUTHOR_MESSAGE',
      'ASSIGNMENT_FEEDBACK',
      'QUIZ_RESULT',
      'PRODUCT_UPDATE',
      'SYSTEM'
    );
  END IF;
END$$;

-- Add notification_type column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'notification_type'
  ) THEN
    ALTER TABLE notifications
    ADD COLUMN notification_type notification_type DEFAULT 'SYSTEM';
  END IF;
END$$;

-- Add action_url column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'action_url'
  ) THEN
    ALTER TABLE notifications
    ADD COLUMN action_url TEXT;
  END IF;
END$$;

-- Add metadata column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE notifications
    ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END$$;

-- Create indexes for performance (skip if they already exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notifications_user_type') THEN
    -- Check if user_id column exists before creating index
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'notifications' 
      AND column_name = 'user_id'
    ) THEN
      CREATE INDEX idx_notifications_user_type ON notifications(user_id, notification_type);
    END IF;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notifications_read') THEN
    -- read_at is in notification_deliveries table, not notifications
    CREATE INDEX idx_notifications_read ON notification_deliveries(read_at) WHERE read_at IS NULL;
  END IF;
END$$;

-- Add comments
COMMENT ON COLUMN notifications.notification_type IS 'Type of notification: LIVE_CLASS_SCHEDULED, LIVE_CLASS_REMINDER, AUTHOR_MESSAGE, ASSIGNMENT_FEEDBACK, QUIZ_RESULT, PRODUCT_UPDATE, SYSTEM';
COMMENT ON COLUMN notifications.action_url IS 'URL to navigate to when notification is clicked';
COMMENT ON COLUMN notifications.metadata IS 'Additional notification data as JSON';