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
    
    // Try to upload directly - if bucket doesn't exist, we'll get a clear error
    const { data, error } = await supabase.storage.from(bucketName).upload(fileName, file);
    if (error) {
      console.error('Supabase upload error:', error);
      console.error('Error details:', {
        message: error.message,
        statusCode: error.statusCode,
        name: error.name
      });
      return null;
    }
    
    console.log('Upload successful, getting public URL...');
    const { data: publicData } = supabase.storage.from(bucketName).getPublicUrl(data.path);
    const publicUrl = publicData?.publicUrl ?? null;
    console.log('Public URL:', publicUrl);
    return publicUrl;
  } catch (e) {
    console.error('uploadThumbnail exception:', e);
    return null;
  }
}
