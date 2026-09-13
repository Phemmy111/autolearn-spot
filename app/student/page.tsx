import Link from 'next/link';
import { BookOpen, Trophy, Award, ArrowRight, Clock, Play, ChevronRight } from 'lucide-react';
import { auth, currentUser } from '@clerk/nextjs/server';
import { UserButton } from '@clerk/nextjs';
import { getUserEnrollments } from '@/lib/enrollment-service';

export const dynamic = 'force-dynamic';

export default async function StudentDashboardPage() {
  const { userId } = await auth();
  const user = await currentUser();
  const firstName = user?.firstName || user?.username || 'Student';
  const primaryEmail = user?.primaryEmailAddress?.emailAddress || '';

  // Fetch real enrollment data
  const enrollments = userId ? await getUserEnrollments(userId, primaryEmail) : [];

  const activeEnrollments = enrollments.filter((e: any) => e.status === 'active' || e.status === 'not_started');
  const completedEnrollments = enrollments.filter((e: any) => e.status === 'completed');
  // Certificates = completed courses (1 cert per completed course)
  const certificates = completedEnrollments.length;

  // Build recent/active course cards (up to 3)
  const recentCourses = activeEnrollments
    .filter((e: any) => e.learning_product)
    .slice(0, 3)
    .map((e: any) => {
      const lp = Array.isArray(e.learning_product) ? e.learning_product[0] : e.learning_product;
      const isStarted = !!e.activated_at;
      let daysLeft: number | null = null;
      if (isStarted && lp?.access_duration_days) {
        const activatedTime = new Date(e.activated_at).getTime();
        const durationMs = lp.access_duration_days * 24 * 60 * 60 * 1000;
        const now = Date.now();
        daysLeft = now > activatedTime + durationMs ? 0 : Math.ceil((activatedTime + durationMs - now) / (1000 * 60 * 60 * 24));
      }
      return { enrollment_id: e.id, isStarted, daysLeft, course: lp };
    });

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-text mb-1">
            Welcome back, {firstName}! 👋
          </h1>
          <p className="text-brand-text/60">
            Continue your learning journey
          </p>
        </div>
        <UserButton afterSignOutUrl="/" />
      </div>

      {/* Stats Row — real data */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 bg-[var(--card)] border border-brand-border rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-[#10b981]/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-[#10b981]" />
            </div>
            <span className="text-sm font-medium text-brand-text/60">Enrolled Courses</span>
          </div>
          <p className="text-3xl font-extrabold text-brand-text">{activeEnrollments.length}</p>
        </div>

        <div className="p-6 bg-[var(--card)] border border-brand-border rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-[#10b981]/10 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-[#10b981]" />
            </div>
            <span className="text-sm font-medium text-brand-text/60">Completed</span>
          </div>
          <p className="text-3xl font-extrabold text-brand-text">{completedEnrollments.length}</p>
        </div>

        <div className="p-6 bg-[var(--card)] border border-brand-border rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-[#10b981]/10 flex items-center justify-center">
              <Award className="w-5 h-5 text-[#10b981]" />
            </div>
            <span className="text-sm font-medium text-brand-text/60">Certificates</span>
          </div>
          <p className="text-3xl font-extrabold text-brand-text">{certificates}</p>
        </div>
      </div>

      {/* Active Courses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-brand-text">My Courses</h2>
          <Link href="/dashboard" className="text-sm font-medium text-[#10b981] flex items-center gap-1 hover:underline">
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {recentCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentCourses.map((c) => (
              <div key={c.enrollment_id} className="bg-[var(--card)] border border-brand-border rounded-xl p-5 flex flex-col gap-3">
                <h3 className="font-bold text-brand-text leading-snug line-clamp-2">{c.course?.title || 'Untitled Course'}</h3>
                {c.isStarted && c.daysLeft !== null ? (
                  <p className="text-xs text-brand-text/50 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {c.daysLeft} days access left
                  </p>
                ) : (
                  <p className="text-xs text-amber-500 font-medium">Not started yet</p>
                )}
                <Link
                  href={c.isStarted ? `/dashboard/course/${c.course?.id}` : '/dashboard'}
                  className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-[#10b981] hover:underline"
                >
                  <Play className="w-4 h-4" />
                  {c.isStarted ? 'Continue' : 'Start Course'}
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[var(--card)] border border-dashed border-brand-border rounded-xl p-10 text-center">
            <BookOpen className="w-10 h-10 text-brand-text/20 mx-auto mb-3" />
            <p className="text-brand-text/60 mb-4">You haven&apos;t bought any courses yet.</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-[#10b981] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#0ea5e9] transition-colors"
            >
              Browse Courses <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
