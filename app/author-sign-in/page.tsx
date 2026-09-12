import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';

/**
 * Author Sign In Page
 *
 * Custom styled login page for authors
 */
export default function AuthorSignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-gray-100 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/author-auth" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Back to Author Portal</span>
            </Link>
            <Link href="/" className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-600" />
              <span className="font-heading text-lg font-bold text-gray-900">
                AutoLearn Spot
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
        <div className="w-full max-w-md">
          <div className="bg-gray-100 rounded-2xl shadow-xl border border-gray-200 p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Author Login
              </h1>
              <p className="text-gray-600">
                Sign in to access your author dashboard
              </p>
            </div>

            <SignIn
              forceRedirectUrl="/author"
              appearance={{
                elements: {
                  card: 'shadow-none',
                  headerTitle: 'text-gray-900 font-semibold',
                  headerSubtitle: 'text-gray-500 text-sm',
                  formButtonPrimary: 'bg-indigo-600 hover:bg-indigo-700 text-white font-medium',
                  formFieldInput: 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                  footerActionLink: 'text-indigo-600 hover:text-indigo-700',
                },
              }}
            />

            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600 mb-3">
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
