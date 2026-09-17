import { NextRequest, NextResponse } from 'next/server';
import { requireAuthor } from '@/lib/author';
import { createResumableUploadSession } from '@/lib/youtube';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthor();
    if ("status" in authResult && typeof authResult.status === 'number') {
      return authResult; // This is a NextResponse from requireAuthor
    }

    const { title, description, mimeType, fileSize } = await request.json();

    if (!title || !mimeType || !fileSize) {
      return NextResponse.json({ error: 'Missing required metadata (title, mimeType, fileSize)' }, { status: 400 });
    }

    const origin = request.headers.get('origin') || 'https://autolearn-spot.vercel.app';
    const result = await createResumableUploadSession(title, description || '', mimeType, fileSize, origin);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Create Upload Session Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

