-- Update the certificate final lesson ID to wk4-vid3
-- This ensures the certificate API only generates certificates when the final lesson is completed

INSERT INTO site_settings (key, value, description)
VALUES ('final_lesson_id:ai-automation-bootcamp', '"wk4-vid3"', 'The ID of the final lesson that triggers certificate generation')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  description = EXCLUDED.description;
