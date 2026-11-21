import React from 'react';
import { requireAdmin } from '@/lib/admin';
import { getActiveConnection } from '@/lib/youtube';
import { redirect } from 'next/navigation';
import YouTubeUploadForm from './YouTubeUploadForm';

export const dynamic = 'force-dynamic';

export default async function YouTubeIntegrationPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  const resolvedSearchParams = await searchParams;
  try {
    await requireAdmin();
  } catch (err) {
    redirect('/');
  }

  const hasOAuthConfig = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const redirectUri = process.env.GOOGLE_YOUTUBE_REDIRECT_URI || 'https://www.autolearnspot.com/api/admin/integrations/youtube/callback';

  // NOTE: If the migration hasn't been run, this will throw an error or return null.
  // We'll gracefully handle it by checking if it throws.
  let connectionData = null;
  let dbError = null;
  try {
    connectionData = await getActiveConnection();
  } catch (err: any) {
    console.error("DB Error fetching connection (Migration might be missing):", err);
    dbError = err.message;
  }

  return (
    <div className="min-h-screen p-8 text-brand-text bg-brand-bg">
      <h1 className="text-3xl font-extrabold mb-6 capitalize">Central YouTube Video Hub</h1>
      <p className="text-brand-text/70 mb-6 max-w-2xl">
        Connect AutoLearn Spot&apos;s centralized YouTube channel. All course videos uploaded by any author or instructor across the platform will be automatically hosted on this channel as unlisted videos.
      </p>
      
      {resolvedSearchParams.success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <span>Successfully connected AutoLearn Spot&apos;s YouTube channel!</span>
        </div>
      )}

      {resolvedSearchParams.error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
          <strong>Configuration Error:</strong> {resolvedSearchParams.error}
        </div>
      )}

      {dbError && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg">
          Warning: Database error detected. Please ensure the youtube_connections table is created in Supabase. ({dbError})
        </div>
      )}

      <div className="bg-[var(--card)] brightness-95 rounded-2xl p-6 shadow-sm border border-gray-100">
        {!connectionData ? (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="flex h-3 w-3 rounded-full bg-amber-400 animate-pulse" />
              <h2 className="text-xl font-bold text-gray-800">Channel Not Connected</h2>
            </div>

            {!hasOAuthConfig ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6 text-sm text-slate-700 space-y-4">
                <div className="font-semibold text-slate-900 text-base flex items-center gap-2">
                  <span>⚡</span> Step 1: Add Google Cloud Credentials to Vercel
                </div>
                <p>
                  To link AutoLearn Spot&apos;s YouTube channel so any author can upload videos, Google requires an OAuth Client ID from Google Cloud Console:
                </p>
                <ol className="list-decimal pl-5 space-y-2 text-slate-700">
                  <li>
                    Go to <strong>Google Cloud Console</strong> (<a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">console.cloud.google.com</a>) and enable the <strong>YouTube Data API v3</strong>.
                  </li>
                  <li>
                    In <strong>Credentials ➔ Create Credentials ➔ OAuth Client ID</strong> (Web Application):
                    <div className="mt-1 p-2 bg-slate-100 rounded border border-slate-200 font-mono text-xs select-all">
                      Authorized redirect URI: {redirectUri}
                    </div>
                  </li>
                  <li>
                    Add these 3 Environment Variables in your <strong>Vercel Project Settings</strong>:
                    <ul className="list-disc pl-5 mt-1 space-y-1 font-mono text-xs text-slate-800">
                      <li>GOOGLE_CLIENT_ID = <i>your-google-client-id</i></li>
                      <li>GOOGLE_CLIENT_SECRET = <i>your-google-client-secret</i></li>
                      <li>GOOGLE_YOUTUBE_REDIRECT_URI = {redirectUri}</li>
                    </ul>
                  </li>
                </ol>
                <p className="text-xs text-slate-500">
                  After saving in Vercel, refresh this page and click &quot;Connect YouTube&quot; to authorize the channel.
                </p>
              </div>
            ) : null}

            <p className="text-gray-600 mb-6">
              Click the button below to sign in with the Google account that owns the official AutoLearn Spot YouTube channel.
            </p>

            <a 
              href="/api/admin/integrations/youtube/connect"
              className="inline-flex items-center px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors shadow-sm gap-2"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              Connect YouTube Channel
            </a>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <h2 className="text-xl font-bold text-gray-800">Connected</h2>
            </div>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-500 mb-1">Channel Name</p>
              <p className="font-medium text-gray-900 mb-4">{connectionData.connection.channel_name}</p>
              
              <p className="text-sm text-gray-500 mb-1">Channel ID</p>
              <p className="font-medium text-gray-900">{connectionData.connection.channel_id}</p>
            </div>

            <div className="flex gap-4">
              <a 
                href="/api/admin/integrations/youtube/connect"
                className="inline-flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
              >
                Reconnect
              </a>
            </div>

            <hr className="my-8 border-gray-200" />
            
            <YouTubeUploadForm />
          </div>
        )}
      </div>
    </div>
  );
}
