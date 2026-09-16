import React from 'react';
import { requireAdmin } from '@/lib/admin';
import { getActiveConnection } from '@/lib/youtube';
import { redirect } from 'next/navigation';
import YouTubeUploadForm from './YouTubeUploadForm';

export const dynamic = 'force-dynamic';

export default async function YouTubeIntegrationPage({ searchParams }: { searchParams: { success?: string; error?: string } }) {
  try {
    await requireAdmin();
  } catch (err) {
    redirect('/');
  }

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
      <h1 className="text-3xl font-extrabold mb-6 capitalize">YouTube Integration</h1>
      
      {searchParams.success && (
        <div className="mb-6 p-4 bg-green-100 text-green-800 rounded-lg">
          Successfully connected to YouTube!
        </div>
      )}

      {searchParams.error && (
        <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-lg">
          Error: {searchParams.error}
        </div>
      )}

      {dbError && (
        <div className="mb-6 p-4 bg-yellow-100 text-yellow-800 rounded-lg">
          Warning: Database error detected. Please ensure the youtube_connections table is created. ({dbError})
        </div>
      )}

      <div className="bg-[var(--card)] brightness-95 rounded-2xl p-6 shadow-sm border border-gray-100">
        {!connectionData ? (
          <div>
            <h2 className="text-xl font-bold mb-2 text-gray-800">Not connected</h2>
            <p className="text-gray-600 mb-6">Connect AutoLearn Spot's YouTube channel to enable video infrastructure.</p>
            <a 
              href="/api/admin/integrations/youtube/connect"
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Connect YouTube
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
