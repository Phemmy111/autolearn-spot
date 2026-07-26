-- Run this script in your Supabase SQL Editor to create the missing tables

-- 1. Ensure uuid-ossp extension exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create cohorts table
CREATE TABLE IF NOT EXISTS cohorts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  price_ngn INTEGER,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN NOT NULL DEFAULT false,
  timezone VARCHAR(64) NOT NULL DEFAULT 'Africa/Lagos',
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Insert a default cohort so foreign keys don't fail
INSERT INTO cohorts (id, name, slug, is_current)
VALUES ('a1111111-1111-1111-1111-111111111111', 'Default Cohort', 'default-cohort', true)
ON CONFLICT (slug) DO NOTHING;

-- 4. Create lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id VARCHAR(100) NOT NULL,
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  vdo_cipher_video_id VARCHAR(255),
  vimeo_video_id VARCHAR(255),
  available_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_label VARCHAR(50),
  week_number INTEGER NOT NULL,
  session_number INTEGER NOT NULL,
  release_day VARCHAR(20) NOT NULL DEFAULT 'monday',
  resources JSONB DEFAULT '[]'::jsonb,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (cohort_id, id)
);

-- 5. Create lesson_progress table
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
  FOREIGN KEY (cohort_id, lesson_id) REFERENCES lessons(cohort_id, id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS lesson_progress_unique_idx ON lesson_progress(cohort_id, lesson_id, user_id);

-- 6. Insert ALL videos (Week 1, Week 2, Week 3, Week 4) into lessons table
INSERT INTO lessons (id, cohort_id, title, description, vdo_cipher_video_id, vimeo_video_id, week_number, session_number, available_at)
VALUES 
  ('wk1-vid1', 'a1111111-1111-1111-1111-111111111111', 'Session 1: n8n Theory & Account Setup', 'Introduction to n8n', '3265363f31454fad9974f182387ce2b1', NULL, 1, 1, '2026-07-13T00:00:00Z'),
  ('wk1-vid2', 'a1111111-1111-1111-1111-111111111111', 'Session 2: Form to Email Automation', 'Build your first automation', '2cf57e7b9f9943319c6ab4f4453927c3', NULL, 1, 2, '2026-07-15T00:00:00Z'),
  ('wk1-vid3', 'a1111111-1111-1111-1111-111111111111', 'Session 3: Google Sheets Integration', 'Google Sheets Integration', '37aba51d45174e7d81324ae262f67d4b', NULL, 1, 3, '2026-07-17T00:00:00Z'),
  ('wk2-vid1', 'a1111111-1111-1111-1111-111111111111', 'Session 4: Connecting AI to Your Workflows', 'Integrate ChatGPT', NULL, '1209374969', 2, 4, '2026-07-20T00:00:00Z'),
  ('wk2-vid2', 'a1111111-1111-1111-1111-111111111111', 'Session 5: AI Email Auto-Responder', 'AI Email Auto-Responder', NULL, '1209383076', 2, 5, '2026-07-22T00:00:00Z'),
  ('wk2-vid3', 'a1111111-1111-1111-1111-111111111111', 'Session 6: AI Content Summarizer', 'AI Content Summarizer', NULL, '1209384996', 2, 6, '2026-07-24T00:00:00Z'),
  ('wk3-vid1', 'a1111111-1111-1111-1111-111111111111', 'Session 7: Week 3 Monday', 'Week 3 Session 1', NULL, '1212926093', 3, 7, '2026-07-27T00:00:00Z'),
  ('wk3-vid2', 'a1111111-1111-1111-1111-111111111111', 'Session 8: Week 3 Wednesday', 'Week 3 Session 2', NULL, '1212944798', 3, 8, '2026-07-29T00:00:00Z'),
  ('wk3-vid3', 'a1111111-1111-1111-1111-111111111111', 'Session 9: Week 3 Friday', 'Week 3 Session 3', NULL, '1213005975', 3, 9, '2026-07-31T00:00:00Z'),
  ('wk4-vid1', 'a1111111-1111-1111-1111-111111111111', 'Session 10: Week 4 Monday', 'Week 4 Session 1', NULL, '1212965316', 4, 10, '2026-08-03T00:00:00Z'),
  ('wk4-vid2', 'a1111111-1111-1111-1111-111111111111', 'Session 11: Week 4 Wednesday', 'Week 4 Session 2', NULL, '1212966091', 4, 11, '2026-08-05T00:00:00Z'),
  ('wk4-vid3', 'a1111111-1111-1111-1111-111111111111', 'Session 12: Week 4 Friday', 'Week 4 Session 3', NULL, '1212966090', 4, 12, '2026-08-07T00:00:00Z')
ON CONFLICT (cohort_id, id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  vdo_cipher_video_id = EXCLUDED.vdo_cipher_video_id,
  vimeo_video_id = EXCLUDED.vimeo_video_id,
  week_number = EXCLUDED.week_number,
  session_number = EXCLUDED.session_number,
  available_at = EXCLUDED.available_at;
