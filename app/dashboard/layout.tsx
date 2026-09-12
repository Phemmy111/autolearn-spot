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
      <div className="min-h-screen bg-gray-100]">
        {/* Simple nav bar for unpaid users so they can still sign out */}
        <nav className="flex h-16 items-center justify-between border-b border-[#3b494b] bg-gray-100] px-4 sm:px-6">
          <div className="flex items-center gap-2 font-mono text-sm font-bold uppercase text-neutral-900">
            <span className="text-[#10b981]">//</span>
            <span className="underline decoration-[#b9cacb] decoration-2 underline-offset-2">AutoLearn Spot</span>
          </div>
        </nav>
        
        <EnrollmentRequired />
      </div>
    );
  }

  // Track login activity for enrolled users
  await trackAuthentication();

  // They are enrolled, render the normal dashboard layout/pages
  return (
    <div className="flex min-h-screen bg-gray-100]">
      <nav className="w-64 bg-gray-100] text-neutral-900 p-4">
        <ul className="space-y-2">
          <li>
            <a href="/dashboard" className="block py-2 hover:text-primary-500">Learning</a>
          </li>
          <li>
            <a href="/dashboard/history" className="block py-2 hover:text-primary-500">Purchase History</a>
          </li>
          <li>
            <a href="/certificate/verify" className="block py-2 hover:text-primary-500">Certificates</a>
          </li>
          <li>
            <a href="/dashboard/settings" className="block py-2 hover:text-primary-500">Profile Settings</a>
          </li>
          <li className="mt-8 border-t border-gray-700 pt-4">
            <a href="/author" className="block py-2 text-primary-500 hover:text-primary-400">Author Dashboard →</a>
          </li>
        </ul>
      </nav>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
