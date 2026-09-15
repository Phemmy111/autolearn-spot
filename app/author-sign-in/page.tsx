'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';
import { ArrowLeft, BookOpen, User, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { isApprovedAuthor } from '@/lib/author';

/**
 * Author Sign In Page
 *
 * If the user is ALREADY signed in (e.g. as a student), we show them an
 * "account picker" UI instead of the Clerk SignIn component (which would loop).
 *
 * The picker lets them:
 *  1. Try their current account → goes to check-auth
 *  2. Sign in with a completely different account
 *
 * If redirected here with ?status=NOT_AUTHOR, we show a clear rejection message.
 */
export default async function AuthorSignInPage({
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

    // Check if the current account is already an approved author
    const alreadyAuthor = await isApprovedAuthor(userId);

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/author-auth" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Back to Author Portal</span>
              </Link>
              <Link href="/" className="flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-indigo-600" />
                <span className="font-heading text-lg font-bold text-gray-900">AutoLearn Spot</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
          <div className="w-full max-w-md space-y-4">

            {/* NOT_AUTHOR status message */}
            {status === 'NOT_AUTHOR' && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-amber-800 mb-1">Account not approved as an author</p>
                  <p className="text-sm text-amber-700">
                    The account <strong>{email}</strong> does not have an approved author profile.
                    You can apply to become an author and get approved first.
                  </p>
                  <Link
                    href="/author-apply"
                    className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    Apply to become an author <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100 text-center">
                <h1 className="text-xl font-bold text-gray-900 mb-1">Author Login</h1>
                <p className="text-sm text-gray-500">
                  You&apos;re currently signed in. Choose how to continue.
                </p>
              </div>

              {/* Current account option */}
              <div className="p-6 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Currently signed in
                </p>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-indigo-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{name}</p>
                    <p className="text-xs text-gray-500 truncate">{email}</p>
                  </div>
                  {alreadyAuthor && (
                    <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                      <ShieldCheck className="w-3.5 h-3.5" /> Author
                    </span>
                  )}
                </div>

                {alreadyAuthor ? (
                  <Link
                    href="/author"
                    className="mt-3 w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-indigo-700 transition-colors"
                  >
                    Go to Author Dashboard <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <Link
                    href="/author/check-auth"
                    className="mt-3 w-full flex items-center justify-center gap-2 bg-gray-900 text-white font-semibold py-3 px-4 rounded-xl hover:bg-gray-700 transition-colors"
                  >
                    Continue with this account <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>

              {/* Sign in with different account */}
              <div className="p-6">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Or use a different account
                </p>
                <Link
                  href="/author-switch-account"
                  className="w-full flex items-center justify-center gap-2 border-2 border-indigo-200 text-indigo-600 font-semibold py-3 px-4 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
                >
                  Sign in with a different account
                </Link>
                <p className="text-xs text-gray-400 text-center mt-2">
                  This will sign you out of your current account
                </p>
              </div>
            </div>

            <p className="text-center text-sm text-gray-500">
              Don&apos;t have an author account?{' '}
              <Link href="/author-apply" className="text-indigo-600 font-medium hover:text-indigo-700">
                Apply here
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- Case 2: Not signed in — show the normal Clerk SignIn component ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/author-auth" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back to Author Portal</span>
            </Link>
            <Link href="/" className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-600" />
              <span className="font-heading text-lg font-bold text-gray-900">AutoLearn Spot</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Author Login</h1>
              <p className="text-gray-500">Sign in to access your author dashboard</p>
            </div>

            <SignIn
              forceRedirectUrl="/author/check-auth"
              appearance={{
                elements: {
                  card: 'shadow-none',
                  formButtonPrimary: 'bg-indigo-600 hover:bg-indigo-700 text-white font-medium',
                  footerActionLink: 'text-indigo-600 hover:text-indigo-700',
                },
              }}
            />

            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-500 mb-3">Don&apos;t have an author account yet?</p>
              <Link
                href="/author-apply"
                className="inline-flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700"
              >
                Apply to become an author <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
