import Link from 'next/link';
import { BookOpen, Trophy, FileText, Award, ArrowRight } from 'lucide-react';
import { auth } from '@clerk/nextjs/server';
import { UserButton } from '@clerk/nextjs';

/**
 * Student Dashboard Landing Page
 *
 * Clean student dashboard with navigation to learning areas.
 * Will be connected to backend data in future phases.
 */
export default async function StudentDashboardPage() {
  const { user } = await auth();
  const firstName = user?.firstName || user?.username || 'Student';

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            Welcome back, {firstName}!
          </h1>
          <p className="text-neutral-600">
            Continue your learning journey
          </p>
        </div>
        <UserButton afterSignOutUrl="/" />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-gray-100 border border-neutral-200 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-5 h-5 text-sky-600" />
            <span className="text-sm font-medium text-neutral-600">Enrolled Courses</span>
          </div>
          <p className="text-3xl font-bold text-neutral-900">0</p>
        </div>

        <div className="p-6 bg-gray-100 border border-neutral-200 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-5 h-5 text-sky-600" />
            <span className="text-sm font-medium text-neutral-600">Completed</span>
          </div>
          <p className="text-3xl font-bold text-neutral-900">0</p>
        </div>

        <div className="p-6 bg-gray-100 border border-neutral-200 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-5 h-5 text-sky-600" />
            <span className="text-sm font-medium text-neutral-600">Certificates</span>
          </div>
          <p className="text-3xl font-bold text-neutral-900">0</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/dashboard"
            className="p-6 bg-gray-100 border border-neutral-200 rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-6 h-6 text-sky-600" />
              <h3 className="font-semibold text-neutral-900">My Learning</h3>
            </div>
            <p className="text-sm text-neutral-600 mb-3">
              View your enrolled courses and progress
            </p>
            <span className="text-sky-600 text-sm font-medium flex items-center gap-1">
              Go to Learning
              <ArrowRight className="w-4 h-4" />
            </span>
          </Link>

          <Link
            href="/marketplace"
            className="p-6 bg-gray-100 border border-neutral-200 rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-6 h-6 text-sky-600" />
              <h3 className="font-semibold text-neutral-900">Browse Courses</h3>
            </div>
            <p className="text-sm text-neutral-600 mb-3">
              Discover new courses to enroll in
            </p>
            <span className="text-sky-600 text-sm font-medium flex items-center gap-1">
              Go to Marketplace
              <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
      </div>

      {/* Empty State for Recent Activity */}
      <div className="p-8 bg-gray-100 border border-neutral-200 rounded-lg">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">
          Recent Activity
        </h2>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <FileText className="w-12 h-12 text-neutral-300 mb-3" />
          <p className="text-neutral-600">
            No recent activity to show
          </p>
        </div>
      </div>
    </div>
  );
}