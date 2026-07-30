-- Migration: Add event_id column to notifications table for idempotency
-- This migration adds the event_id column with unique constraint to prevent duplicate notifications

-- Step 1: Add the event_id column (nullable initially to allow existing rows)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS event_id TEXT;

-- Step 2: Create unique index on event_id (only for non-null values)
-- This allows existing rows with NULL event_id while enforcing uniqueness for new rows
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_event_id 
  ON notifications(event_id) 
  WHERE event_id IS NOT NULL;

-- Step 3: Add comment to document the column
COMMENT ON COLUMN notifications.event_id IS 'Unique identifier for idempotent notification creation. Prevents duplicate notifications for the same event.';

-- Verification query (run this to verify the migration succeeded):
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'notifications' AND column_name = 'event_id';
