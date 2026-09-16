import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { uploadUrl, fileSize } = await request.json();

    if (!uploadUrl || !fileSize) {
      return NextResponse.json({ error: 'Missing uploadUrl or fileSize' }, { status: 400 });
    }

    // Query Google for the status of this upload session
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Range': `bytes */${fileSize}`
      }
    });

    if (response.status === 200 || response.status === 201) {
      const data = await response.json();
      return NextResponse.json({ success: true, videoId: data.id });
    } else if (response.status === 308) {
      return NextResponse.json({ success: false, status: 'incomplete' });
    } else {
      const text = await response.text();
      return NextResponse.json({ error: `Unexpected status: ${response.status} ${text}` }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
