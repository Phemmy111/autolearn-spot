import { ReactNode } from 'react';
import { auth } from '@clerk/nextjs/server';
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

  // Check if user is an approved author
  const approved = await isApprovedAuthor(userId);

  if (!approved) {
    // Try to link author profile by email (for users who applied without auth)
    const user = await auth();
    const email = user?.user?.emailAddresses?.[0]?.emailAddress;

    if (email) {
      const linked = await linkAuthorProfile(userId, email);
      if (linked) {
        // Retry approval check after linking
        const approvedAfterLink = await isApprovedAuthor(userId);
        if (approvedAfterLink) {
          return <AuthorShell>{children}</AuthorShell>;
        }
      }
    }

    // Check if user has an author record (even if not active)
    const hasRecord = await hasAuthorRecord(userId);
    const authorStatus = await getAuthorStatus(userId);

    if (hasRecord) {
      // User has an author account but is not active - redirect to sign-in with status info
      // If status is ACTIVE but check failed, something is wrong - let them try signing in
      if (authorStatus === 'ACTIVE') {
        // Status is active but check failed - possible data inconsistency, let them through
        return <AuthorShell>{children}</AuthorShell>;
      }
      redirect(`/author-sign-in?status=${authorStatus || 'PENDING'}`);
    } else {
      // User has no author record - redirect to apply
      redirect('/author-apply');
    }
  }

  return <AuthorShell>{children}</AuthorShell>;
}
