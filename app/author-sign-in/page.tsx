import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { isApprovedAuthor, hasAuthorRecord, getAuthorStatus, linkAuthorProfile } from '@/lib/author';

/**
 * Author Sign In Page
 *
 * Custom styled login page for authors
 * This page should be accessible to anyone - no redirects
 * After sign-in, the redirect URL will handle authorization
 */
export default async function AuthorSignInPage() {
  const { userId } = await auth();

  // If user is already authenticated, redirect them appropriately
  if (userId) {
    // Try to link author profile by email
    const user = await auth();
    const email = user?.user?.emailAddresses?.[0]?.emailAddress;

    if (email) {
      const linked = await linkAuthorProfile(userId, email);
      if (linked) {
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
      // User has author account but not active - redirect to check-auth for status display
      redirect('/author/check-auth');
    } else {
      // User has no author record - redirect to apply
      redirect('/author-apply');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-[var(--card)] brightness-95 border-b border-brand-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/author-auth" className="flex items-center gap-2 text-brand-text/70 hover:text-brand-text transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back to Author Portal</span>
            </Link>
            <Link href="/" className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-600" />
              <span className="font-heading text-lg font-bold text-brand-text">
                AutoLearn Spot
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <div className="w-full max-w-md">
          <div className="bg-[var(--card)] brightness-95 rounded-2xl shadow-xl border border-brand-border p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-brand-text mb-2">
                Author Login
              </h1>
              <p className="text-brand-text/70">
                Sign in to access your author dashboard
              </p>
            </div>

            <SignIn
              forceRedirectUrl="/author/check-auth"
              appearance={{
                elements: {
                  card: 'shadow-none',
                  headerTitle: 'text-brand-text font-semibold',
                  headerSubtitle: 'text-brand-text/60 text-sm',
                  formButtonPrimary: 'bg-indigo-600 hover:bg-indigo-700 text-white font-medium',
                  formFieldInput: 'border-brand-border focus:border-indigo-500 focus:ring-indigo-500',
                  footerActionLink: 'text-indigo-600 hover:text-indigo-700',
                },
              }}
            />

            <div className="mt-6 pt-6 border-t border-brand-border text-center">
              <p className="text-sm text-brand-text/70 mb-3">
                Don't have an author account yet?
              </p>
              <Link
                href="/author-apply"
                className="inline-flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700"
              >
                Apply to become an author
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
