-- Update certificate background to use new professional template
UPDATE site_settings 
SET value = '"/certificate-template.png"'::jsonb 
WHERE key = 'certificate_background_url';

-- Ensure the setting exists
INSERT INTO site_settings (key, value) VALUES
  ('certificate_background_url', '"/certificate-template.png"'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
