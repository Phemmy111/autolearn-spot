-- Create storage bucket for author documents

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

-- Enable RLS for the bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can upload to author-documents (for application submission)
CREATE POLICY "Public upload to author-documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'author-documents');

-- Policy: Users can view their own uploaded documents
CREATE POLICY "Users can view own author documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'author-documents' AND
  auth.jwt() ->> 'sub' = (storage.foldername(name))[1]
);

-- Policy: Admins can view all author documents
CREATE POLICY "Admins can view all author documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'author-documents' AND
  (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'role' = 'super_admin')
);
