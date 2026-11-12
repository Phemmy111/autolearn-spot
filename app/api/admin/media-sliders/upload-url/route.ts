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
    const body = await request.json();
    const { fileName, fileType, fileSize } = body;

    if (!fileName || !fileType) {
      return NextResponse.json({ success: false, error: 'File name and type required' }, { status: 400 });
    }

    // Limit to 50MB for video/media
    const MAX_SIZE = 50 * 1024 * 1024;
    if (fileSize && fileSize > MAX_SIZE) {
      return NextResponse.json({ success: false, error: 'File exceeds 50MB maximum limit' }, { status: 400 });
    }

    const fileExt = fileName.split('.').pop() || 'bin';
    const cleanFileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { data, error } = await supabaseAdmin
      .storage
      .from(BUCKET_NAME)
      .createSignedUploadUrl(cleanFileName);

    if (error || !data) {
      console.error('[Upload URL] Error creating signed URL:', error);
      return NextResponse.json({ success: false, error: error?.message || 'Failed to create signed URL' }, { status: 500 });
    }

    const publicUrl = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(cleanFileName).data.publicUrl;

    return NextResponse.json({
      success: true,
      signedUrl: data.signedUrl,
      token: data.token,
      path: cleanFileName,
      publicUrl,
    });
  } catch (error: any) {
    console.error('[Upload URL] Internal error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
