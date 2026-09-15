import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { isApprovedAuthor, hasAuthorRecord, getAuthorStatus, linkAuthorProfile } from '@/lib/author';

/**
 * Post-Authentication Check Page
 * 
 * This page handles the redirect after sign-in:
 * - If approved author → redirect to /author dashboard
 * - If has author record but not active → show status info
 * - If no author record → redirect to /author-apply
 */
export default async function CheckAuthPage() {
  const { userId } = await auth();

  if (!userId) {
    // Not authenticated, redirect to sign-in
    redirect('/author-sign-in');
  }

  // Try to link author profile by email (for users who applied without auth)
  const user = await auth();
  const email = user?.user?.emailAddresses?.[0]?.emailAddress;

  if (email) {
    const linked = await linkAuthorProfile(userId, email);
    if (linked) {
      // Retry approval check after linking
      const approvedAfterLink = await isApprovedAuthor(userId);
      if (approvedAfterLink) {
        redirect('/author');
      }
    }
  }

  // Check if user is an approved author
  const approved = await isApprovedAuthor(userId);
  
  if (approved) {
    // User is approved author, send to dashboard
    redirect('/author');
  }

  // Check if user has an author record
  const hasRecord = await hasAuthorRecord(userId);
  const authorStatus = await getAuthorStatus(userId);

  if (hasRecord) {
    // User has author account but not active - show status info
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-[var(--card)] brightness-95 rounded-2xl shadow-xl border border-brand-border p-8 text-center">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-brand-text mb-2">
              Author Account Status
            </h1>
            <p className="text-brand-text/70">
              Your author account is currently: <span className="font-semibold">{authorStatus || 'PENDING'}</span>
            </p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              {authorStatus === 'PENDING' && 'Your application is under review. You will be notified once approved.'}
              {authorStatus === 'REJECTED' && 'Your application was not approved. Please contact support for more information.'}
              {authorStatus === 'SUSPENDED' && 'Your account has been suspended. Please contact support for assistance.'}
              {!authorStatus && 'Your account status is being processed.'}
            </p>
          </div>

          <div className="space-y-3">
            <Link
              href="/author-auth"
              className="block w-full px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors text-center"
            >
              Return to Author Portal
            </Link>
            <Link
              href="/"
              className="block w-full px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors text-center"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  } else {
    // User has no author record - redirect to apply
    redirect('/author-apply');
  }
}