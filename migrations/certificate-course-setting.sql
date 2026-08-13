-- Add certificate_course setting to site_settings
INSERT INTO site_settings (key, value) VALUES
  ('certificate_course', '"n8n Automation"'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
