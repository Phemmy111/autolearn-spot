import { supabase } from '@/lib/supabase';

/**
 * Upload a file to Supabase storage and return the public URL.
 * @param file - File object from an <input type="file"/>
 * @param bucket - Optional bucket name (defaults to env variable or 'product-thumbnails')
 */
export async function uploadThumbnail(file: File, bucket?: string): Promise<string | null> {
  try {
    const bucketName = bucket || process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'product-thumbnails';
    const ext = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${ext}`;
    
    console.log(`Attempting to upload to bucket: ${bucketName}, file: ${fileName}`);
    
    // Check if bucket exists, if not try to create it
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === bucketName);
    
    if (!bucketExists) {
      console.warn(`Bucket ${bucketName} does not exist, attempting to create it`);
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024 // 5MB limit
      });
      if (createError) {
        console.error('Failed to create bucket:', createError);
        return null;
      }
    }
    
    const { data, error } = await supabase.storage.from(bucketName).upload(fileName, file);
    if (error) {
      console.error('Supabase upload error:', error);
      return null;
    }
    const { data: publicData } = supabase.storage.from(bucketName).getPublicUrl(data.path);
    return publicData?.publicUrl ?? null;
  } catch (e) {
    console.error('uploadThumbnail exception:', e);
    return null;
  }
}
