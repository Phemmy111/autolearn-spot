import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { getAuthorizationUrl } from '@/lib/youtube';
import crypto from 'crypto';

export async function GET() {
  try {
    await requireAdmin();
    
    // Generate a random state string for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');
    // We could store the state in a cookie to verify it later, but for this POC we'll pass it directly
    const authUrl = getAuthorizationUrl(state);

    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error('YouTube Connect Error:', error);
    return new NextResponse('Unauthorized', { status: 401 });
  }
}
