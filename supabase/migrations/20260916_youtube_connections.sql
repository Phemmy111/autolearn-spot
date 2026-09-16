CREATE TABLE IF NOT EXISTS youtube_connections (
  id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'google',
  channel_id TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  encrypted_refresh_token TEXT NOT NULL,
  scopes TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  connected_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_videos (
  id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  youtube_video_id TEXT NOT NULL,
  youtube_url TEXT,
  upload_status TEXT NOT NULL,
  processing_status TEXT,
  privacy_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);