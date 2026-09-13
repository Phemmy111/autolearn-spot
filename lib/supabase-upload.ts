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
