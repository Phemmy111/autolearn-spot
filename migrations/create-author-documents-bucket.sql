-- Create storage bucket for author documents
-- IMPORTANT: This must be run in Supabase Dashboard SQL Editor (requires owner permissions)
-- Storage bucket creation via SQL typically requires database owner privileges

-- Alternative: Create bucket manually in Supabase Dashboard:
-- 1. Go to Storage → New bucket
-- 2. Name: author-documents
-- 3. Public: false (private)
-- 4. File size limit: 10MB
-- 5. Allowed MIME types: application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/zip, application/x-zip-compressed, image/jpeg, image/jpg, image/png

-- Insert storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'author-documents',
  'author-documents',
  false, -- private bucket
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip', 'application/x-zip-compressed', 'image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- Note: RLS policies for storage.objects must be configured in Supabase dashboard
-- or by a database owner with proper permissions
