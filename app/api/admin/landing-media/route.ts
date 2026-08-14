import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const videoFile = formData.get('videoFile') as File | null;
    const imageFile = formData.get('imageFile') as File | null;

    const result: any = {};

    // Handle video upload
    if (videoFile && videoFile.size > 0) {
      const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
      
      if (!validVideoTypes.includes(videoFile.type)) {
        return NextResponse.json({ error: 'Invalid video format. Must be MP4, WebM, or MOV' }, { status: 400 });
      }

      if (videoFile.size > 50 * 1024 * 1024) { // 50MB limit
        return NextResponse.json({ error: 'Video file too large. Maximum size is 50MB' }, { status: 400 });
      }

      const fileExt = videoFile.name.split('.').pop();
      const fileName = `landing/preview-video-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabaseAdmin
        .storage
        .from('admin-media')
        .upload(fileName, videoFile, {
          contentType: videoFile.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('[POST /api/admin/landing-media] Video upload error:', uploadError);
        return NextResponse.json({ error: 'Failed to upload video' }, { status: 500 });
      }

      const { data: { publicUrl } } = supabaseAdmin
        .storage
        .from('admin-media')
        .getPublicUrl(fileName);

      result.videoUrl = publicUrl;
    }

    // Handle image upload
    if (imageFile && imageFile.size > 0) {
      const validImageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
      
      if (!validImageTypes.includes(imageFile.type)) {
        return NextResponse.json({ error: 'Invalid image format. Must be PNG, JPG, WebP, or GIF' }, { status: 400 });
      }

      if (imageFile.size > 5 * 1024 * 1024) { // 5MB limit
        return NextResponse.json({ error: 'Image file too large. Maximum size is 5MB' }, { status: 400 });
      }

      const fileExt = imageFile.name.split('.').pop();
      const fileName = `landing/preview-image-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabaseAdmin
        .storage
        .from('admin-media')
        .upload(fileName, imageFile, {
          contentType: imageFile.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('[POST /api/admin/landing-media] Image upload error:', uploadError);
        return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
      }

      const { data: { publicUrl } } = supabaseAdmin
        .storage
        .from('admin-media')
        .getPublicUrl(fileName);

      result.imageUrl = publicUrl;
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[POST /api/admin/landing-media] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}