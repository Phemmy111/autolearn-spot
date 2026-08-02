import { NextResponse } from 'next/server';
import { SessionService } from '@/lib/growth-engine/SessionService';

export async function POST(request: Request) {
  try {
    await SessionService.destroySession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[POST /api/partners/logout] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}