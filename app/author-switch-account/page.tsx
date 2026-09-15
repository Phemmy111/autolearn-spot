'use client';

import { useClerk } from '@clerk/nextjs';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Author Switch Account Page
 *
 * Signs the user out of their current Clerk session and redirects them
 * to the author sign-in page so they can log in with a different account.
 * Uses Clerk's client-side signOut() which works reliably in all environments.
 */
export default function AuthorSwitchAccountPage() {
  const { signOut } = useClerk();

  useEffect(() => {
    signOut({ redirectUrl: '/author-sign-in' });
  }, [signOut]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
        <p className="text-gray-600 font-medium">Signing out...</p>
        <p className="text-sm text-gray-400">You&apos;ll be redirected to sign in with a different account.</p>
      </div>
    </div>
  );
}
