// app/api/jitsi/recording/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const recordingsPath = path.join(process.cwd(), 'data', 'recordings.json');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Ensure recordings file exists
    let recordings: any[] = [];
    try {
      const existing = await fs.promises.readFile(recordingsPath, 'utf8');
      recordings = JSON.parse(existing);
    } catch (_) {
      // file may not exist yet
    }
    recordings.push({ ...body, receivedAt: new Date().toISOString() });
    await fs.promises.writeFile(recordingsPath, JSON.stringify(recordings, null, 2), 'utf8');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to store recording' }, { status: 500 });
  }
}
