import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { uploadVideo } from '@/lib/youtube';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string || 'Test Video';
    const description = formData.get('description') as string || 'Test upload via API';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Convert file to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Call the YouTube upload service
    const result = await uploadVideo(buffer, file.type, title, description);

    // Save to our minimal video record table
    try {
      await supabaseAdmin.from('course_videos').insert({
        youtube_video_id: result.videoId,
        youtube_url: result.videoUrl,
        upload_status: result.uploadStatus,
        privacy_status: result.privacyStatus,
      });
    } catch (dbErr) {
      console.warn("Could not save to course_videos (migration might be missing):", dbErr);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Test Upload Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
