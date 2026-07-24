-- =============================================================================
-- Notification Center Schema
-- Phase 4: AutoLearn Spot
-- 
-- Tables: notifications, notification_deliveries, notification_preferences
-- RLS: Enabled on all tables, all API operations use supabaseAdmin (service role)
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. notifications
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id              BIGSERIAL     PRIMARY KEY,
  title           TEXT          NOT NULL,
  message         TEXT          NOT NULL,
  media_url       TEXT,
  icon            TEXT,
  category        TEXT          NOT NULL CHECK (category IN (
                    'announcement','assignment','assignment_review','quiz',
                    'payment','enrollment','certificate','live_class','system')),
  priority        TEXT          NOT NULL CHECK (priority IN ('normal','important','urgent')),
  is_pinned       BOOLEAN       NOT NULL DEFAULT false,
  target_type     TEXT          NOT NULL CHECK (target_type IN ('all','cohort','student')),
  target_id       TEXT,
  action_url      TEXT,
  action_label    TEXT,
  expires_at      TIMESTAMPTZ,
  deleted_at      TIMESTAMPTZ,
  created_by      TEXT,
  recipient_count INTEGER       NOT NULL DEFAULT 0,
  delivery_summary JSONB        DEFAULT '{}',
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

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
