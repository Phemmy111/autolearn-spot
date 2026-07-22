import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { hasActiveEnrollment } from '@/lib/enrollment-service';
import { EnrollmentRequired } from '@/components/enrollment-required';

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
      <div className="min-h-screen bg-[#111317]">
        {/* Simple nav bar for unpaid users so they can still sign out */}
        <nav className="flex h-16 items-center justify-between border-b border-[#3b494b] bg-[#111317] px-4 sm:px-6">
          <div className="flex items-center gap-2 font-mono text-sm font-bold uppercase text-white">
            <span className="text-[#00f0ff]">//</span>
            <span className="underline decoration-[#b9cacb] decoration-2 underline-offset-2">AutoLearn Spot</span>
          </div>
        </nav>
        
        <EnrollmentRequired />
      </div>
    );
  }

  // They are enrolled, render the normal dashboard layout/pages
  return <>{children}</>;
}
