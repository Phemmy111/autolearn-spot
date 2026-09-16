import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { exchangeCodeForTokens, saveConnection, getChannelInfo } from '@/lib/youtube';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { userId } = await auth();
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(new URL('/admin/integrations/youtube?error=' + error, request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/admin/integrations/youtube?error=no_code', request.url));
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);
    
    if (!tokens.refresh_token) {
      return NextResponse.redirect(new URL('/admin/integrations/youtube?error=no_refresh_token', request.url));
    }

    // Fetch channel info
    const channelInfo = await getChannelInfo(tokens.access_token);
    
    // Save to database securely
    await saveConnection(
      channelInfo.id,
      channelInfo.snippet.title,
      tokens.refresh_token,
      tokens.scope,
      userId
    );

    return NextResponse.redirect(new URL('/admin/integrations/youtube?success=true', request.url));
  } catch (error: any) {
    console.error('YouTube Callback Error:', error);
    return NextResponse.redirect(new URL('/admin/integrations/youtube?error=' + encodeURIComponent(error.message), request.url));
  }
}
