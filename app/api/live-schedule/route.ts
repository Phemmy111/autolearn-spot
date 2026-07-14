// app/api/live-schedule/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const schedulePath = path.join(process.cwd(), 'data', 'live-schedule.json');

export async function GET() {
  try {
    const data = await fs.promises.readFile(schedulePath, 'utf8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read schedule' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await fs.promises.writeFile(schedulePath, JSON.stringify(body, null, 2), 'utf8');
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to write schedule' }, { status: 500 });
  }
}
