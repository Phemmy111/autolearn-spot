import { NextResponse } from 'next/server';
import { CommunityAuthService } from '@/lib/growth-engine/CommunityAuthService';
import { SessionService } from '@/lib/growth-engine/SessionService';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const result = await CommunityAuthService.authenticate(email, password);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    await SessionService.createSession(result.user.id, 'community');
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
