import { ReactNode } from 'react';
import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { isApprovedAuthor, linkAuthorProfile, hasAuthorRecord, getAuthorStatus } from '@/lib/author';
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

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress;

  // Check if user is an approved author by Clerk user ID or email
  const approved = await isApprovedAuthor(userId, email);

  if (!approved) {
    // Check if user has an author record to show appropriate status message
    const hasRecord = await hasAuthorRecord(userId);
    const authorStatus = await getAuthorStatus(userId);

    if (hasRecord) {
      redirect(`/author-auth?status=${authorStatus || 'PENDING'}`);
    } else {
      redirect('/author-auth');
    }
  }

  return <AuthorShell>{children}</AuthorShell>;
}
