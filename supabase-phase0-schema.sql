-- Phase 0: Cohort foundation schema
-- Run this against your Supabase project after supabase-schema.sql
-- Safe to re-run: uses IF NOT EXISTS / conditional alters throughout

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Fixed UUID for Cohort 1 (stable references in seed data and scripts)
-- a1111111-1111-1111-1111-111111111111

-- ---------------------------------------------------------------------------
-- Cohorts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cohorts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  price_ngn INTEGER,
  status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft | active | archived
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN NOT NULL DEFAULT false,
  timezone VARCHAR(64) NOT NULL DEFAULT 'Africa/Lagos',
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cohorts_single_current
  ON cohorts(is_current) WHERE is_current = true;

CREATE INDEX IF NOT EXISTS idx_cohorts_status ON cohorts(status);
CREATE INDEX IF NOT EXISTS idx_cohorts_slug ON cohorts(slug);

-- ---------------------------------------------------------------------------
-- Lessons (replaces static videos.ts as source of truth over time)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lessons (
  id VARCHAR(100) NOT NULL, -- slug e.g. wk1-vid1
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  vdo_cipher_video_id VARCHAR(255),
  vimeo_video_id VARCHAR(255),
  available_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_label VARCHAR(50),
  week_number INTEGER NOT NULL,
  session_number INTEGER NOT NULL,
  release_day VARCHAR(20) NOT NULL DEFAULT 'monday', -- monday | wednesday | friday
  resources JSONB DEFAULT '[]'::jsonb,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (cohort_id, id)
);

CREATE INDEX IF NOT EXISTS idx_lessons_cohort_week ON lessons(cohort_id, week_number);
CREATE INDEX IF NOT EXISTS idx_lessons_available_at ON lessons(available_at);

-- ---------------------------------------------------------------------------
-- Enrollments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  clerk_user_id VARCHAR(255),
  payment_ref VARCHAR(255),
  amount_paid INTEGER,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending | active | revoked
  referral_code VARCHAR(100),
  referred_by_code VARCHAR(100),
  invited_at TIMESTAMP WITH TIME ZONE,
  activated_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (cohort_id, email)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_email ON enrollments(email);
CREATE INDEX IF NOT EXISTS idx_enrollments_clerk_user ON enrollments(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_cohort ON enrollments(cohort_id);

-- ---------------------------------------------------------------------------
-- Lesson progress (replaces localStorage tracking)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lesson_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  lesson_id VARCHAR(100) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  watch_pct INTEGER NOT NULL DEFAULT 0 CHECK (watch_pct >= 0 AND watch_pct <= 100),
  last_position_seconds INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (cohort_id, lesson_id, user_id),
  FOREIGN KEY (cohort_id, lesson_id) REFERENCES lessons(cohort_id, id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_cohort_user ON lesson_progress(cohort_id, user_id);

-- ---------------------------------------------------------------------------
-- Assignments & submissions (Phase 4 prep)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  lesson_id VARCHAR(100),
  week_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  submission_type VARCHAR(50) NOT NULL DEFAULT 'both', -- screenshot | url | both
  rubric TEXT,
  ai_review_prompt TEXT,
  is_required BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (cohort_id, lesson_id) REFERENCES lessons(cohort_id, id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_assignments_cohort ON assignments(cohort_id);

CREATE TABLE IF NOT EXISTS submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  screenshot_url TEXT,
  live_url TEXT,
  notes TEXT,
  ai_feedback TEXT,
  ai_score INTEGER,
  status VARCHAR(50) NOT NULL DEFAULT 'submitted', -- submitted | approved | needs_revision
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (assignment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_submissions_user ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);

-- ---------------------------------------------------------------------------
-- Certificates
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS certificates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  certificate_code VARCHAR(32) NOT NULL UNIQUE,
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  user_email VARCHAR(255),
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  verification_url TEXT,
  revoked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (cohort_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_certificates_code ON certificates(certificate_code);
CREATE INDEX IF NOT EXISTS idx_certificates_user ON certificates(user_id);

CREATE TABLE IF NOT EXISTS certificate_overrides (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  granted_by VARCHAR(255) NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (cohort_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Community feed (Phase 7 prep)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  body TEXT NOT NULL,
  lesson_id VARCHAR(100),
  screenshot_url TEXT,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_posts_cohort ON community_posts(cohort_id, created_at DESC);

CREATE TABLE IF NOT EXISTS community_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  is_instructor_reply BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_comments_post ON community_comments(post_id, created_at ASC);

-- ---------------------------------------------------------------------------
-- Referrals & commissions (Phase 10 prep)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  referrer_user_id VARCHAR(255),
  referrer_email VARCHAR(255),
  referral_code VARCHAR(100) NOT NULL,
  commission_amount_ngn INTEGER NOT NULL DEFAULT 500,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (cohort_id, referral_code)
);

CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);

CREATE TABLE IF NOT EXISTS referral_commissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  amount_ngn INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending | paid
  paid_at TIMESTAMP WITH TIME ZONE,
  paid_by VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (enrollment_id)
);

-- ---------------------------------------------------------------------------
-- Extend existing tables with cohort_id
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quizzes' AND column_name = 'cohort_id'
  ) THEN
    ALTER TABLE quizzes ADD COLUMN cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quiz_responses' AND column_name = 'cohort_id'
  ) THEN
    ALTER TABLE quiz_responses ADD COLUMN cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leaderboard' AND column_name = 'cohort_id'
  ) THEN
    ALTER TABLE leaderboard ADD COLUMN cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_quizzes_cohort ON quizzes(cohort_id);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_cohort ON quiz_responses(cohort_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_cohort_score ON leaderboard(cohort_id, total_score DESC);

-- Leaderboard: move from global unique user to per-cohort unique user
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'leaderboard_user_id_key'
  ) THEN
    ALTER TABLE leaderboard DROP CONSTRAINT leaderboard_user_id_key;
  END IF;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_user_cohort
  ON leaderboard(user_id, cohort_id);

-- ---------------------------------------------------------------------------
-- Leaderboard trigger: include cohort_id from quiz
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_quiz_response_cohort_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.cohort_id IS NULL THEN
    SELECT cohort_id INTO NEW.cohort_id FROM quizzes WHERE id = NEW.quiz_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_quiz_response_cohort ON quiz_responses;
CREATE TRIGGER trigger_set_quiz_response_cohort
  BEFORE INSERT ON quiz_responses
  FOR EACH ROW
  EXECUTE FUNCTION set_quiz_response_cohort_id();

CREATE OR REPLACE FUNCTION update_leaderboard()
RETURNS TRIGGER AS $$
DECLARE
  v_cohort_id UUID;
BEGIN
  v_cohort_id := NEW.cohort_id;
  IF v_cohort_id IS NULL THEN
    SELECT cohort_id INTO v_cohort_id FROM quizzes WHERE id = NEW.quiz_id;
  END IF;

  INSERT INTO leaderboard (
    user_id, user_name, user_email, cohort_id,
    total_score, quizzes_completed, quizzes_passed,
    average_score, last_activity, updated_at
  )
  VALUES (
    NEW.user_id,
    NEW.user_name,
    NEW.user_email,
    v_cohort_id,
    NEW.score,
    1,
    CASE WHEN NEW.passed THEN 1 ELSE 0 END,
    NEW.percentage::DECIMAL,
    NEW.completed_at,
    NOW()
  )
  ON CONFLICT (user_id, cohort_id) DO UPDATE SET
    total_score = leaderboard.total_score + NEW.score,
    quizzes_completed = leaderboard.quizzes_completed + 1,
    quizzes_passed = leaderboard.quizzes_passed + CASE WHEN NEW.passed THEN 1 ELSE 0 END,
    average_score = (
      (leaderboard.average_score * leaderboard.quizzes_completed + NEW.percentage) /
      (leaderboard.quizzes_completed + 1)
    ),
    last_activity = NEW.completed_at,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- Row Level Security (restrictive — API uses service role)
-- ---------------------------------------------------------------------------
ALTER TABLE cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_commissions ENABLE ROW LEVEL SECURITY;

-- Public read for active cohort metadata and lessons
DROP POLICY IF EXISTS "Public can view active cohorts" ON cohorts;
CREATE POLICY "Public can view active cohorts" ON cohorts
  FOR SELECT USING (status IN ('active', 'archived'));

DROP POLICY IF EXISTS "Public can view lessons for active cohorts" ON lessons;
CREATE POLICY "Public can view lessons for active cohorts" ON lessons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cohorts
      WHERE cohorts.id = lessons.cohort_id
      AND cohorts.status IN ('active', 'archived')
    )
  );

-- Block direct client writes on all new tables
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'cohorts', 'enrollments', 'lesson_progress', 'assignments', 'submissions',
    'certificates', 'certificate_overrides', 'community_posts', 'community_comments',
    'referrals', 'referral_commissions'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "No direct inserts on %I" ON %I', t, t);
    EXECUTE format('CREATE POLICY "No direct inserts on %I" ON %I FOR INSERT WITH CHECK (false)', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "No direct updates on %I" ON %I', t, t);
    EXECUTE format('CREATE POLICY "No direct updates on %I" ON %I FOR UPDATE USING (false)', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "No direct deletes on %I" ON %I', t, t);
    EXECUTE format('CREATE POLICY "No direct deletes on %I" ON %I FOR DELETE USING (false)', t, t);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "No direct inserts on lessons" ON lessons;
CREATE POLICY "No direct inserts on lessons" ON lessons FOR INSERT WITH CHECK (false);
DROP POLICY IF EXISTS "No direct updates on lessons" ON lessons;
CREATE POLICY "No direct updates on lessons" ON lessons FOR UPDATE USING (false);
DROP POLICY IF EXISTS "No direct deletes on lessons" ON lessons;
CREATE POLICY "No direct deletes on lessons" ON lessons FOR DELETE USING (false);

DROP POLICY IF EXISTS "No direct selects on enrollments" ON enrollments;
CREATE POLICY "No direct selects on enrollments" ON enrollments FOR SELECT USING (false);

DROP POLICY IF EXISTS "No direct selects on lesson_progress" ON lesson_progress;
CREATE POLICY "No direct selects on lesson_progress" ON lesson_progress FOR SELECT USING (false);

DROP POLICY IF EXISTS "No direct selects on certificates" ON certificates;
CREATE POLICY "Public can verify certificates by code" ON certificates
  FOR SELECT USING (revoked_at IS NULL);

-- ---------------------------------------------------------------------------
-- Seed Cohort 1 + lessons from current curriculum
-- ---------------------------------------------------------------------------
INSERT INTO cohorts (
  id, name, slug, price_ngn, status, start_date, is_current, timezone, settings
) VALUES (
  'a1111111-1111-1111-1111-111111111111',
  'Cohort 1',
  'cohort-1',
  3000,
  'active',
  '2026-07-13',
  true,
  'Africa/Lagos',
  jsonb_build_object(
    'schedule', jsonb_build_object(
      'video_release_days', jsonb_build_array('monday', 'wednesday', 'friday'),
      'quiz_days', jsonb_build_array('tuesday', 'thursday', 'saturday'),
      'live_day', 'saturday',
      'live_time', '20:00',
      'timezone', 'Africa/Lagos'
    ),
    'certificate_rules', jsonb_build_object(
      'min_video_completion_pct', 100,
      'require_all_quizzes_passed', true,
      'require_all_assignments_approved', true
    ),
    'referral_commission_ngn', 500
  )
)
ON CONFLICT (slug) DO UPDATE SET
  status = EXCLUDED.status,
  is_current = EXCLUDED.is_current,
  price_ngn = EXCLUDED.price_ngn,
  settings = EXCLUDED.settings,
  updated_at = NOW();

-- Lessons (from data/videos.ts)
INSERT INTO lessons (
  id, cohort_id, title, description, vdo_cipher_video_id, vimeo_video_id,
  available_at, duration_label, week_number, session_number, release_day, order_index
) VALUES
  ('wk1-vid1', 'a1111111-1111-1111-1111-111111111111',
   'Session 1: n8n Theory & Account Setup',
   'Introduction to n8n, how to set up your account, and the core concepts of nodes, triggers, and credentials.',
   '3265363f31454fad9974f182387ce2b1', NULL,
   '2026-07-13T00:00:00+01:00', '30 mins', 1, 1, 'monday', 1),
  ('wk1-vid2', 'a1111111-1111-1111-1111-111111111111',
   'Session 2: Form to Email Automation',
   'Build your first automation: trigger a workflow from a webhook/form and send an email automatically.',
   '2cf57e7b9f9943319c6ab4f4453927c3', NULL,
   '2026-07-15T00:00:00+01:00', '30 mins', 1, 2, 'wednesday', 2),
  ('wk1-vid3', 'a1111111-1111-1111-1111-111111111111',
   'Session 3: Google Sheets Integration',
   'Learn how to read from and write to Google Sheets to store your automation data permanently.',
   '37aba51d45174e7d81324ae262f67d4b', NULL,
   '2026-07-17T00:00:00+01:00', '35 mins', 1, 3, 'friday', 3),
  ('wk2-vid1', 'a1111111-1111-1111-1111-111111111111',
   'Session 4: Connecting AI to Your Workflows',
   'Learn how to integrate ChatGPT and process incoming data with AI.',
   NULL, '1209374969',
   '2026-07-20T00:00:00+01:00', '45 mins', 2, 4, 'monday', 4),
  ('wk2-vid2', 'a1111111-1111-1111-1111-111111111111',
   'Session 5: AI Email Auto-Responder',
   'Learn how to automatically read incoming emails, generate a response using AI, and send it back.',
   NULL, '1209383076',
   '2026-07-22T00:00:00+01:00', '40 mins', 2, 5, 'wednesday', 5),
  ('wk2-vid3', 'a1111111-1111-1111-1111-111111111111',
   'Session 6: AI Content Summarizer',
   'Learn how to scrape website content and use AI to generate concise summaries.',
   NULL, '1209384996',
   '2026-07-24T00:00:00+01:00', '35 mins', 2, 6, 'friday', 6)
ON CONFLICT (cohort_id, id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  vdo_cipher_video_id = EXCLUDED.vdo_cipher_video_id,
  vimeo_video_id = EXCLUDED.vimeo_video_id,
  available_at = EXCLUDED.available_at,
  duration_label = EXCLUDED.duration_label,
  week_number = EXCLUDED.week_number,
  session_number = EXCLUDED.session_number,
  release_day = EXCLUDED.release_day,
  order_index = EXCLUDED.order_index,
  updated_at = NOW();

-- Backfill existing quizzes/leaderboard to Cohort 1 where unset
UPDATE quizzes
SET cohort_id = 'a1111111-1111-1111-1111-111111111111'
WHERE cohort_id IS NULL;

UPDATE quiz_responses qr
SET cohort_id = q.cohort_id
FROM quizzes q
WHERE qr.quiz_id = q.id
  AND qr.cohort_id IS NULL
  AND q.cohort_id IS NOT NULL;

UPDATE leaderboard
SET cohort_id = 'a1111111-1111-1111-1111-111111111111'
WHERE cohort_id IS NULL;
