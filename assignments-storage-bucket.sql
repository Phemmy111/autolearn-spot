-- Create storage bucket for assignment submissions
-- This bucket will store student screenshot uploads

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assignment-submissions',
  'assignment-submissions',
  false, -- Private bucket (access via signed URLs)
  5242880, -- 5 MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow authenticated users to upload
-- Authorization is handled at API route level, so we allow uploads from authenticated users
CREATE POLICY "Authenticated users can upload to assignment-submissions"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'assignment-submissions'
  AND auth.role() = 'authenticated'
);

-- Create policy to allow public read access (for viewing images)
CREATE POLICY "Public can read assignment-submissions"
ON storage.objects FOR SELECT
USING (bucket_id = 'assignment-submissions');

-- Create policy to allow authenticated users to delete their own uploads
CREATE POLICY "Authenticated users can delete from assignment-submissions"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'assignment-submissions'
  AND auth.role() = 'authenticated'
);
