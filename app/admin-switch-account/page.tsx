'use client';

import { useClerk } from '@clerk/nextjs';
import { useEffect } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';

/**
 * Admin Switch Account Page
 *
 * Signs the user out of their current Clerk session and redirects them
 * to the admin sign-in page so they can log in with a different admin account.
 */
export default function AdminSwitchAccountPage() {
  const { signOut } = useClerk();

  useEffect(() => {
    signOut({ redirectUrl: '/admin-sign-in' });
  }, [signOut]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950">
      <div className="text-center space-y-4">
        <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldCheck className="w-7 h-7 text-emerald-400" />
        </div>
        <Loader2 className="w-7 h-7 animate-spin text-emerald-500 mx-auto" />
        <p className="text-white font-medium">Signing out...</p>
        <p className="text-sm text-slate-400">You&apos;ll be redirected to sign in with a different admin account.</p>
      </div>
    </div>
  );
}
