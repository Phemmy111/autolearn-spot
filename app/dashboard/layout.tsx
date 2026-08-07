import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { hasActiveEnrollment } from '@/lib/enrollment-service';
import { EnrollmentRequired } from '@/components/enrollment-required';
import { trackAuthentication } from '@/lib/auth-tracking';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    redirect('/sign-in');
  }

  const primaryEmail = user.primaryEmailAddress?.emailAddress;
  if (!primaryEmail) {
    redirect('/sign-in');
  }

  const isEnrolled = await hasActiveEnrollment(userId, primaryEmail);

  if (!isEnrolled) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        {/* Simple nav bar for unpaid users so they can still sign out */}
        <nav className="flex h-16 items-center justify-between border-b border-[var(--border)] bg-[var(--background)] px-4 sm:px-6">
          <div className="flex items-center gap-2 font-mono text-sm font-bold uppercase text-[var(--foreground)]">
            <span className="text-[var(--primary)]">//</span>
            <span className="underline decoration-[var(--muted-foreground)] decoration-2 underline-offset-2">AutoLearn Spot</span>
          </div>
        </nav>
        
        <EnrollmentRequired />
      </div>
    );
  }

  // Track login activity for enrolled users
  await trackAuthentication();

  // They are enrolled, render the normal dashboard layout/pages
  return <>{children}</>;
}
