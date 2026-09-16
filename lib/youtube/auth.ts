import { supabaseAdmin } from '../supabase';
import { encryptToken, decryptToken } from './encryption';
import { YouTubeConnection } from './types';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_YOUTUBE_REDIRECT_URI!;
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

export function getAuthorizationUrl(state: string): string {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_REDIRECT_URI) {
    throw new Error('Missing Google OAuth environment variables');
  }

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.append('client_id', GOOGLE_CLIENT_ID);
  url.searchParams.append('redirect_uri', GOOGLE_REDIRECT_URI);
  url.searchParams.append('response_type', 'code');
  url.searchParams.append('scope', 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly');
  url.searchParams.append('access_type', 'offline');
  url.searchParams.append('prompt', 'consent'); // Force consent to ensure we get a refresh token
  url.searchParams.append('state', state);

  return url.toString();
}

export async function exchangeCodeForTokens(code: string) {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: GOOGLE_REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code: ${error}`);
  }

  return response.json();
}

export async function refreshAccessToken(refreshToken: string) {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh access token');
  }

  return response.json();
}

export async function saveConnection(
  channelId: string, 
  channelName: string, 
  refreshToken: string, 
  scopes: string, 
  adminId: string
) {
  // Encrypt the refresh token before storing
  const encryptedToken = encryptToken(refreshToken);

  const connectionData = {
    provider: 'google',
    channel_id: channelId,
    channel_name: channelName,
    encrypted_refresh_token: encryptedToken,
    scopes,
    connected_by: adminId,
    status: 'active'
  };

  // Keep only one active connection for AutoLearn Spot
  // We'll delete existing ones or upsert. Let's delete existing first to be clean.
  await supabaseAdmin.from('youtube_connections').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  const { data, error } = await supabaseAdmin
    .from('youtube_connections')
    .insert(connectionData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save YouTube connection: ${error.message}`);
  }

  return data;
}

export async function getActiveConnection(): Promise<{ connection: YouTubeConnection, accessToken: string } | null> {
  const { data, error } = await supabaseAdmin
    .from('youtube_connections')
    .select('*')
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  try {
    const refreshToken = decryptToken(data.encrypted_refresh_token);
    const tokens = await refreshAccessToken(refreshToken);
    
    return {
      connection: data,
      accessToken: tokens.access_token
    };
  } catch (err) {
    console.error('Failed to get active connection access token:', err);
    // Mark as error if refresh fails
    await supabaseAdmin.from('youtube_connections').update({ status: 'error' }).eq('id', data.id);
    return null;
  }
}
