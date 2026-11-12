import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const BUCKET_NAME = 'admin-media';

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Validate file size (up to 4.2MB for direct route to avoid Vercel 4.5MB payload limit; larger files use upload-url signed URL)
    const maxSize = 4.2 * 1024 * 1024;
    if (file.size > maxSize) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return NextResponse.json({ success: false, error: `File size ${sizeMB}MB exceeds direct upload limit. Please use a smaller file or compress it.` }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'Invalid file type. Allowed: PNG, JPEG, WebP, GIF, MP4, WebM' }, { status: 400 });
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    console.log('[Media Slider Upload] Uploading file:', fileName, 'size:', file.size, 'type:', file.type);

    const { data, error } = await supabaseAdmin
      .storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('[Media Slider Upload] Storage error:', error);
      throw error;
    }

    const publicUrl = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(fileName).data.publicUrl;

    console.log('[Media Slider Upload] Upload successful:', publicUrl);

    return NextResponse.json({
      success: true,
      url: publicUrl
    });
  } catch (error: any) {
    console.error('[Media Slider Upload] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}