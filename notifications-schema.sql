-- =============================================================================
-- Notification Center Schema Migration
-- Phase 4: AutoLearn Spot
-- 
-- Migration: Add event_id column for idempotent notification creation
-- Tables: notifications, notification_deliveries, notification_preferences
-- RLS: Enabled on all tables, all API operations use supabaseAdmin (service role)
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Add event_id column to notifications table
-- ─────────────────────────────────────────────────────────────────────────────

-- Step 1: Add the event_id column (nullable initially to allow existing rows)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS event_id TEXT;

-- Step 2: Create unique index on event_id (only for non-null values)
-- This allows existing rows with NULL event_id while enforcing uniqueness for new rows
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_event_id 
  ON notifications(event_id) 
  WHERE event_id IS NOT NULL;

-- Step 3: Add comment to document the column
COMMENT ON COLUMN notifications.event_id IS 'Unique identifier for idempotent notification creation. Prevents duplicate notifications for the same event.';

-- ─────────────────────────────────────────────────────────────────────────────
-- Existing Schema (for reference - these should already exist)
-- ─────────────────────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. notification_deliveries
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_deliveries (
  id              BIGSERIAL     PRIMARY KEY,
  notification_id BIGINT        NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  user_id         TEXT          NOT NULL,
  channel         TEXT          NOT NULL CHECK (channel IN ('in_app','email')),
  status          TEXT          NOT NULL CHECK (status IN ('unread','read','delivered','failed')),
  read_at         TIMESTAMPTZ,
  opened          BOOLEAN       NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Index for fast student notification queries
CREATE INDEX IF NOT EXISTS idx_deliveries_user_status 
  ON notification_deliveries(user_id, status);
CREATE INDEX IF NOT EXISTS idx_deliveries_notification 
  ON notification_deliveries(notification_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. notification_preferences (one row per user)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_preferences (
  id                          BIGSERIAL     PRIMARY KEY,
  user_id                     TEXT          NOT NULL UNIQUE,
  assignment_updates          BOOLEAN       NOT NULL DEFAULT true,
  quiz_notifications          BOOLEAN       NOT NULL DEFAULT true,
  live_class_notifications    BOOLEAN       NOT NULL DEFAULT true,
  email_notifications         BOOLEAN       NOT NULL DEFAULT true,
  announcement_notifications  BOOLEAN       NOT NULL DEFAULT true,
  created_at                  TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Row Level Security
--    RLS is enabled. No public-facing policies are created.
--    All API operations use the service role (supabaseAdmin) which bypasses RLS.
--    This ensures public/anon access is denied by default.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
