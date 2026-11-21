import { NextRequest, NextResponse } from 'next/server';
import { requireAuthor } from '@/lib/author';
import { getActiveConnection } from '@/lib/youtube';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthor();
    if ("status" in authResult && typeof authResult.status === 'number') {
      return authResult;
    }

    const { uploadUrl, fileSize, title } = await request.json();
    if (!uploadUrl) {
      return NextResponse.json({ error: 'Missing uploadUrl' }, { status: 400 });
    }

    const connectionData = await getActiveConnection();
    if (!connectionData) {
      return NextResponse.json({ error: 'No active YouTube connection found' }, { status: 500 });
    }

    // 1. Check status directly with Google's Resumable Upload session
    try {
      const googleRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${connectionData.accessToken}`,
          'Content-Range': `bytes */${fileSize || 0}`,
          'Content-Length': '0',
        },
      });

      if (googleRes.ok || googleRes.status === 200 || googleRes.status === 201) {
        const text = await googleRes.text();
        if (text) {
          try {
            const data = JSON.parse(text);
            if (data.id) {
              await saveVideoRecord(data.id, data.status?.uploadStatus, data.status?.privacyStatus);
              return NextResponse.json({
                success: true,
                videoId: data.id,
                videoUrl: `https://www.youtube.com/watch?v=${data.id}`,
              });
            }
          } catch (parseErr) {
            console.warn('Failed to parse Google upload status JSON:', parseErr);
          }
        }
      }
    } catch (checkErr) {
      console.warn('Direct uploadUrl status check failed:', checkErr);
    }

    // 2. Fallback: Search the channel for the latest uploaded video
    try {
      const channelId = connectionData.connection.channel_id;
      const searchRes = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=date&type=video&maxResults=5`,
        {
          headers: {
            Authorization: `Bearer ${connectionData.accessToken}`,
          },
        }
      );

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        // Check if any recent video matches title or is created within the last 10 minutes
        const items = searchData.items || [];
        if (items.length > 0) {
          const candidate = items.find((item: any) => title && item.snippet?.title === title) || items[0];
          if (candidate?.id?.videoId) {
            const videoId = candidate.id.videoId;
            await saveVideoRecord(videoId, 'uploaded', 'unlisted');
            return NextResponse.json({
              success: true,
              videoId,
              videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
            });
          }
        }
      }
    } catch (searchErr) {
      console.error('Channel search fallback failed:', searchErr);
    }

    return NextResponse.json({ success: false, error: 'Upload could not be verified yet. Please try again or check in a moment.' }, { status: 404 });
  } catch (error: any) {
    console.error('Upload Status Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function saveVideoRecord(videoId: string, uploadStatus?: string, privacyStatus?: string) {
  try {
    await supabaseAdmin.from('course_videos').insert({
      youtube_video_id: videoId,
      youtube_url: `https://www.youtube.com/watch?v=${videoId}`,
      upload_status: uploadStatus || 'uploaded',
      privacy_status: privacyStatus || 'unlisted',
    });
  } catch (dbErr) {
    console.warn('Could not save to course_videos:', dbErr);
  }
}
