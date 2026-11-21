import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { getAuthorizationUrl } from '@/lib/youtube';
import crypto from 'crypto';

export async function GET(request: Request) {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.redirect(new URL('/sign-in?redirect_url=/admin/integrations/youtube', request.url));
    }
    
    // Generate a random state string for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');
    const authUrl = getAuthorizationUrl(state);

    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error('YouTube Connect Error:', error);
    const errorMessage = error?.message || 'Failed to initialize YouTube connection';
    return NextResponse.redirect(new URL(`/admin/integrations/youtube?error=${encodeURIComponent(errorMessage)}`, request.url));
  }
}
