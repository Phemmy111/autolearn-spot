import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { getVideoStatus } from '@/lib/youtube';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const videoId = request.nextUrl.searchParams.get('videoId');
    if (!videoId) {
      return NextResponse.json({ error: 'Missing videoId' }, { status: 400 });
    }

    const status = await getVideoStatus(videoId);

    // Update the database record
    try {
      await supabaseAdmin
        .from('course_videos')
        .update({
          upload_status: status.uploadStatus,
          privacy_status: status.privacyStatus,
          processing_status: status.processingStatus || null,
        })
        .eq('youtube_video_id', videoId);
    } catch (dbErr) {
      console.warn("Could not update course_videos (migration might be missing):", dbErr);
    }

    return NextResponse.json(status);
  } catch (error: any) {
    console.error('Video Status Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
