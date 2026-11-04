/**
 * Upload a file to Supabase storage and return the public URL.
 * Routes through the server upload route (using supabaseAdmin) to avoid client RLS restrictions,
 * with a fallback to direct upload if the endpoint is unreachable.
 * 
 * @param file - File object from an <input type="file"/>
 * @param bucket - Optional bucket name (defaults to 'product-thumbnails')
 */
export async function uploadThumbnail(file: File, bucket?: string): Promise<string | null> {
  try {
    const bucketName = bucket || process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'product-thumbnails';
    
    // 1. Try server-side upload route (authenticated via Clerk session and uploaded with service role key)
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', bucketName);

      const res = await fetch('/api/upload/thumbnail', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          console.log('[uploadThumbnail] Server upload successful:', data.url);
          return data.url;
        }
      } else {
        const errText = await res.text();
        console.warn('[uploadThumbnail] Server route failed, trying direct upload:', errText);
      }
    } catch (serverErr) {
      console.warn('[uploadThumbnail] Server route network error:', serverErr);
    }

    // 2. Fallback: direct Supabase client upload
    const { supabase } = await import('@/lib/supabase');
    const ext = file.name.split('.').pop() || 'png';
    const fileName = `${crypto.randomUUID()}.${ext}`;
    
    console.log(`[uploadThumbnail] Attempting direct client upload to bucket: ${bucketName}, file: ${fileName}`);
    
    const { data, error } = await supabase.storage.from(bucketName).upload(fileName, file);
    if (error) {
      console.error('[uploadThumbnail] Supabase upload error:', error);
      return null;
    }
    
    const { data: publicData } = supabase.storage.from(bucketName).getPublicUrl(data.path);
    const publicUrl = publicData?.publicUrl ?? null;
    return publicUrl;
  } catch (e) {
    console.error('[uploadThumbnail] Exception during upload:', e);
    return null;
  }
}
