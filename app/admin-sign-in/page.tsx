'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ShieldCheck, AlertCircle, User, LayoutDashboard } from 'lucide-react';
import { isAdmin } from '@/lib/admin';

/**
 * Admin Sign In Page
 *
 * If the user is ALREADY signed in (e.g. as a student or author), we show an
 * "account picker" UI instead of the Clerk SignIn component (which would loop).
 *
 * The picker lets them:
 *  1. Try their current account → goes to /admin/check-auth
 *  2. Sign in with a completely different admin account
 *
 * If redirected here with ?status=NOT_ADMIN, we show a clear rejection message.
 */
export default async function AdminSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { userId } = await auth();
  const { status } = await searchParams;

  // --- Case 1: Already signed in — show account picker ---
  if (userId) {
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? 'your account';
    const name = clerkUser?.firstName
      ? `${clerkUser.firstName}${clerkUser.lastName ? ' ' + clerkUser.lastName : ''}`
      : email;
    const avatarUrl = clerkUser?.imageUrl;

    // Check if the current account is already an admin
    const alreadyAdmin = await isAdmin();

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950">
        {/* Header */}
        <div className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Back to Site</span>
              </Link>
              <Link href="/" className="flex items-center gap-2">
                <LayoutDashboard className="w-6 h-6 text-emerald-400" />
                <span className="font-heading text-lg font-bold text-white">AutoLearn Spot Admin</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
          <div className="w-full max-w-md space-y-4">

            {/* NOT_ADMIN status message */}
            {status === 'NOT_ADMIN' && (
              <div className="bg-red-950/60 border border-red-700/50 rounded-2xl p-5 flex gap-3 backdrop-blur-sm">
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-red-300 mb-1">Account not authorised as admin</p>
                  <p className="text-sm text-red-400">
                    The account <strong className="text-red-300">{email}</strong> does not have admin privileges.
                    Please use a different account or contact the system owner.
                  </p>
                </div>
              </div>
            )}

            <div className="bg-slate-800/70 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700/60 overflow-hidden">
              <div className="p-6 border-b border-slate-700/50 text-center">
                <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                </div>
                <h1 className="text-xl font-bold text-white mb-1">Admin Login</h1>
                <p className="text-sm text-slate-400">
                  You&apos;re currently signed in. Choose how to continue.
                </p>
              </div>

              {/* Current account option */}
              <div className="p-6 border-b border-slate-700/50">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Currently signed in
                </p>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-700/40 border border-slate-600/50">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={name} className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/30" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                      <User className="w-5 h-5 text-emerald-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{name}</p>
                    <p className="text-xs text-slate-400 truncate">{email}</p>
                  </div>
                  {alreadyAdmin && (
                    <span className="flex items-center gap-1 text-xs font-medium text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2 py-1 rounded-full">
                      <ShieldCheck className="w-3.5 h-3.5" /> Admin
                    </span>
                  )}
                </div>

                {alreadyAdmin ? (
                  <Link
                    href="/admin"
                    className="mt-3 w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
                  >
                    Go to Admin Dashboard <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <Link
                    href="/admin/check-auth"
                    className="mt-3 w-full flex items-center justify-center gap-2 bg-slate-600 hover:bg-slate-500 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
                  >
                    Continue with this account <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>

              {/* Sign in with different account */}
              <div className="p-6">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Or use a different account
                </p>
                <Link
                  href="/admin-switch-account"
                  className="w-full flex items-center justify-center gap-2 border-2 border-emerald-600/50 text-emerald-400 font-semibold py-3 px-4 rounded-xl hover:border-emerald-500 hover:bg-emerald-500/10 transition-colors"
                >
                  Sign in with a different account
                </Link>
                <p className="text-xs text-slate-500 text-center mt-2">
                  This will sign you out of your current account
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Case 2: Not signed in — show the normal Clerk SignIn component ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950">
      {/* Header */}
      <div className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back to Site</span>
            </Link>
            <Link href="/" className="flex items-center gap-2">
              <LayoutDashboard className="w-6 h-6 text-emerald-400" />
              <span className="font-heading text-lg font-bold text-white">AutoLearn Spot Admin</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <div className="w-full max-w-md">
          <div className="bg-slate-800/70 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700/60 p-8">
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-7 h-7 text-emerald-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Admin Portal</h1>
              <p className="text-slate-400">Sign in to access the admin dashboard</p>
            </div>

            <SignIn
              forceRedirectUrl="/admin/check-auth"
              appearance={{
                elements: {
                  card: 'shadow-none bg-transparent',
                  formButtonPrimary: 'bg-emerald-600 hover:bg-emerald-500 text-white font-medium',
                  footerActionLink: 'text-emerald-400 hover:text-emerald-300',
                  headerTitle: 'hidden',
                  headerSubtitle: 'hidden',
                  socialButtonsBlockButton: 'border-slate-600 text-slate-300 hover:bg-slate-700',
                  formFieldInput: 'bg-slate-700 border-slate-600 text-white placeholder-slate-400',
                  formFieldLabel: 'text-slate-300',
                  dividerLine: 'bg-slate-600',
                  dividerText: 'text-slate-400',
                },
              }}
            />

            <div className="mt-6 pt-6 border-t border-slate-700/50 text-center">
              <p className="text-sm text-slate-500">
                Authorised personnel only. Contact the system owner if you need access.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
