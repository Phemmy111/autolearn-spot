import { supabase } from '@/lib/supabase';

/**
 * Upload a file to Supabase storage and return the public URL.
 * @param file - File object from an <input type="file"/>
 * @param bucket - Optional bucket name (defaults to env variable or 'thumbnails')
 */
export async function uploadThumbnail(file: File, bucket?: string): Promise<string | null> {
  try {
    const bucketName = bucket || process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'thumbnails';
    const ext = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${ext}`;
    const { data, error } = await supabase.storage.from(bucketName).upload(fileName, file);
    if (error) {
      console.warn('Supabase upload error (falling back to placeholder):', error);
      return '/images/placeholder.jpg';
    }
    const { data: publicData } = supabase.storage.from(bucketName).getPublicUrl(data.path);
    return publicData?.publicUrl ?? '/images/placeholder.jpg';
  } catch (e) {
    console.warn('uploadThumbnail exception (falling back to placeholder):', e);
    return '/images/placeholder.jpg';
  }
}
