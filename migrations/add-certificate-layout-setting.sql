-- Add certificate layout setting to site_settings
-- This stores the JSON layout configuration for the visual certificate designer

INSERT INTO site_settings (key, value) VALUES
  ('certificate_layout', 'null'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
