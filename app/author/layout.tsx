import { ReactNode } from 'react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { isApprovedAuthor } from '@/lib/author';
import { AuthorShell } from '@/components/author/AuthorShell';

/**
 * AUTHOR Layout Shell
 * 
 * Author sidebar/navigation, header, and page content container.
 * Requires authentication and approved author status.
 */
export default async function AuthorLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const approved = await isApprovedAuthor(userId);
  if (!approved) {
    redirect('/author-apply');
  }

  return <AuthorShell>{children}</AuthorShell>;
}