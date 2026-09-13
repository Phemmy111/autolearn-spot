import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { trackAuthentication } from '@/lib/auth-tracking';
import { StudentShell } from '@/components/student/StudentShell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  const user = await currentUser();

  // Must be logged in
  if (!userId || !user) {
    redirect('/sign-in');
  }

  // Track login activity
  await trackAuthentication();

  // Render the dashboard — the page itself handles the empty state
  // if the user has no purchased courses.
  return (
    <StudentShell>
      {children}
    </StudentShell>
  );
}
