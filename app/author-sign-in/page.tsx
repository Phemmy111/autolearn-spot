import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';
import { ArrowLeft, BookOpen, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

/**
 * Author Sign In Page
 *
 * Custom styled login page for authors
 */
export default async function AuthorSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  const getStatusMessage = () => {
    switch (status) {
      case 'PENDING':
        return {
          icon: <Clock className="w-5 h-5 text-yellow-600" />,
          title: 'Application Pending',
          message: 'Your author application is currently under review. You will be notified once approved.',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800'
        };
      case 'REJECTED':
        return {
          icon: <AlertCircle className="w-5 h-5 text-red-600" />,
          title: 'Application Rejected',
          message: 'Your author application was not approved. Please contact support for more information.',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800'
        };
      case 'SUSPENDED':
        return {
          icon: <AlertCircle className="w-5 h-5 text-red-600" />,
          title: 'Account Suspended',
          message: 'Your author account has been suspended. Please contact support for assistance.',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800'
        };
      case 'ACTIVE':
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
          title: 'Account Active',
          message: 'Your author account is active. Please sign in to access your dashboard.',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800'
        };
      default:
        return null;
    }
  };

  const statusMessage = getStatusMessage();

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

            {/* Status Message */}
            {statusMessage && (
              <div className={`mb-6 p-4 rounded-lg border ${statusMessage.bgColor} ${statusMessage.borderColor}`}>
                <div className="flex items-start gap-3">
                  {statusMessage.icon}
                  <div className="flex-1">
                    <h3 className={`font-semibold ${statusMessage.textColor} mb-1`}>
                      {statusMessage.title}
                    </h3>
                    <p className={`text-sm ${statusMessage.textColor}`}>
                      {statusMessage.message}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <SignIn
              forceRedirectUrl="/author"
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
