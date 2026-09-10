-- Create storage bucket for author documents
-- Note: This migration must be run by a database owner or via Supabase dashboard

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
