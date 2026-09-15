import Link from 'next/link';
import { UserPlus, LogIn, ArrowRight, BookOpen, Users, DollarSign, TrendingUp, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

/**
 * Author Auth Landing Page
 *
 * Entry point for authors to either:
 * 1. Create an account and apply
 * 2. Login to existing author dashboard
 * 3. Return to home
 * 
 * Can also display status information if redirected from check-auth
 */
export default async function AuthorAuthPage({
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
          message: 'Your account has been suspended. Please contact support for assistance.',
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
        {/* Status Message */}
        {statusMessage && (
          <div className={`mb-8 p-4 rounded-lg border ${statusMessage.bgColor} ${statusMessage.borderColor}`}>
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
