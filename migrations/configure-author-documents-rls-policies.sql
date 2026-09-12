-- Configure RLS policies for author-documents storage bucket
-- Run this in Supabase Dashboard SQL Editor

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access to author documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated insert to author documents" ON storage.objects;
DROP POLICY IF EXISTS "Service role full access" ON storage.objects;

-- Policy 1: Public read access to author documents
CREATE POLICY "Public read access to author documents"
ON storage.objects FOR SELECT
TO public, authenticated
USING (bucket_id = 'author-documents');

-- Policy 2: Authenticated insert to author documents
CREATE POLICY "Authenticated insert to author documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'author-documents');

-- Policy 3: Service role full access
CREATE POLICY "Service role full access"
ON storage.objects FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Note: These policies allow public read access to documents in the author-documents bucket
-- If you want documents to be completely private, remove 'public' from the first policy
