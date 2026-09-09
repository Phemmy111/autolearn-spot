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

  // Track login activity for enrolled users
  await trackAuthentication();

  // They are enrolled, render the normal dashboard layout/pages
  return (
    <div className="flex min-h-screen bg-[#111317]">
      <nav className="w-64 bg-[#1a1d23] text-white p-4">
        <ul className="space-y-2">
          <li><a href="/dashboard/earnings" className="block py-2 hover:text-primary-500">Earnings</a></li>
          <li><a href="/dashboard/transactions" className="block py-2 hover:text-primary-500">Transactions</a></li>
          <li><a href="/dashboard/bank-profile" className="block py-2 hover:text-primary-500">Bank Profile</a></li>
          <li>
            <span className="block py-2">Withdrawals</span>
            <ul className="ml-4 space-y-1">
              <li><a href="/dashboard/withdrawals/request" className="block py-1 hover:text-primary-500">Request Withdrawal</a></li>
              <li><a href="/dashboard/withdrawals/history" className="block py-1 hover:text-primary-500">Withdrawal History</a></li>
            </ul>
          </li>
        </ul>
      </nav>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
