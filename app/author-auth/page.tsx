import Link from 'next/link';
import { UserPlus, LogIn, ArrowRight, BookOpen, Users, DollarSign, TrendingUp } from 'lucide-react';

/**
 * Author Auth Landing Page
 *
 * Entry point for authors to either:
 * 1. Create an account and apply
 * 2. Login to existing author dashboard
 * 3. Return to home
 */
export default function AuthorAuthPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <BookOpen className="w-8 h-8 text-indigo-600" />
              <span className="font-heading text-xl font-bold text-gray-900">
                AutoLearn Spot
              </span>
            </Link>
            <Link
              href="/"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Author Studio
          </h1>
          <p className="text-xl text-gray-600">
            Join our community of expert instructors and share your knowledge with the world
          </p>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <DollarSign className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Earn Revenue</h3>
            <p className="text-sm text-gray-600">
              Create and sell courses while earning competitive commissions
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Reach Students</h3>
            <p className="text-sm text-gray-600">
              Connect with thousands of eager learners across Africa
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Grow Your Brand</h3>
            <p className="text-sm text-gray-600">
              Build your reputation as an expert in your field
            </p>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Create Account Card */}
          <Link
            href="/author-apply"
            className="group bg-white rounded-xl p-8 border-2 border-indigo-200 hover:border-indigo-400 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-700 transition-colors">
                <UserPlus className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Create Account & Apply
                </h2>
                <p className="text-gray-600 mb-4">
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
            className="group bg-white rounded-xl p-8 border-2 border-gray-200 hover:border-indigo-400 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 transition-colors">
                <LogIn className="w-7 h-7 text-gray-600 group-hover:text-indigo-600 transition-colors" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Login to Dashboard
                </h2>
                <p className="text-gray-600 mb-4">
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
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
