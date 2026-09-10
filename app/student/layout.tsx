import { ReactNode } from 'react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { StudentShell } from '@/components/student/StudentShell';

/**
 * STUDENT Layout Shell
 * 
 * Student sidebar/navigation, header, and page content container.
 * Requires authentication.
 */
export default async function StudentLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return <StudentShell>{children}</StudentShell>;
}