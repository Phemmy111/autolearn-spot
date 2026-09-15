import Link from 'next/link';
import { UserPlus, LogIn, ArrowRight, BookOpen, Users, DollarSign, TrendingUp } from 'lucide-react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { isApprovedAuthor, hasAuthorRecord, getAuthorStatus, linkAuthorProfile } from '@/lib/author';

/**
 * Author Auth Landing Page
 *
 * Entry point for authors to either:
 * 1. Create an account and apply
 * 2. Login to existing author dashboard
 * 3. Return to home
 * 
 * Also handles post-sign-in routing based on author status
 */
export default async function AuthorAuthPage() {
  const { userId } = await auth();

  // If user is authenticated, check their author status and redirect appropriately
  if (userId) {
    const approved = await isApprovedAuthor(userId);
    
    if (approved) {
      // User is approved author, send to dashboard
      redirect('/author');
    } else {
      // Try to link author profile by email
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

              <Link
                href="/"
                className="inline-flex items-center gap-2 text-indigo-600 font-medium hover:text-indigo-700"
              >
                Return to Home
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        );
      } else {
        // User has no author record - redirect to apply
        redirect('/author-apply');
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-[var(--card)] brightness-95 border-b border-brand-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <BookOpen className="w-8 h-8 text-indigo-600" />
              <span className="font-heading text-xl font-bold text-brand-text">
                AutoLearn Spot
              </span>
            </Link>
            <Link
              href="/"
              className="text-sm font-medium text-brand-text/70 hover:text-brand-text transition-colors"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-brand-text mb-4">
            Author Studio
          </h1>
          <p className="text-xl text-brand-text/70">
            Join our community of expert instructors and share your knowledge with the world
          </p>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-[var(--card)] brightness-95 rounded-xl p-6 border border-brand-border shadow-sm">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <DollarSign className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-brand-text mb-2">Earn Revenue</h3>
            <p className="text-sm text-brand-text/70">
              Create and sell courses while earning competitive commissions
            </p>
          </div>

          <div className="bg-[var(--card)] brightness-95 rounded-xl p-6 border border-brand-border shadow-sm">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-brand-text mb-2">Reach Students</h3>
            <p className="text-sm text-brand-text/70">
              Connect with thousands of eager learners across Africa
            </p>
          </div>

          <div className="bg-[var(--card)] brightness-95 rounded-xl p-6 border border-brand-border shadow-sm">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-brand-primary" />
            </div>
            <h3 className="font-semibold text-brand-text mb-2">Grow Your Brand</h3>
            <p className="text-sm text-brand-text/70">
              Build your reputation as an expert in your field
            </p>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Create Account Card */}
          <Link
            href="/author-apply"
            className="group bg-[var(--card)] brightness-95 rounded-xl p-8 border-2 border-indigo-200 hover:border-indigo-400 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-700 transition-colors">
                <UserPlus className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-brand-text mb-2">
                  Create Account & Apply
                </h2>
                <p className="text-brand-text/70 mb-4">
                  New to AutoLearn Spot? Create an account and submit your instructor application to get started.
                </p>
                <div className="flex items-center text-indigo-600 font-semibold group-hover:text-indigo-700">
                  Start Application
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>

          {/* Login Card */}
          <Link
            href="/author-sign-in"
            className="group bg-[var(--card)] brightness-95 rounded-xl p-8 border-2 border-brand-border hover:border-indigo-400 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-[var(--card)] brightness-95 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 transition-colors">
                <LogIn className="w-7 h-7 text-brand-text/70 group-hover:text-indigo-600 transition-colors" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-brand-text mb-2">
                  Login to Dashboard
                </h2>
                <p className="text-brand-text/70 mb-4">
                  Already an approved author? Login to access your dashboard and manage your courses.
                </p>
                <div className="flex items-center text-indigo-600 font-semibold group-hover:text-indigo-700">
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Return to Home */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-brand-text/70 hover:text-brand-text transition-colors"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
