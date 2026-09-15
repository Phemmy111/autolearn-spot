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

    // Check if user has an author record to show appropriate status
    const hasRecord = await hasAuthorRecord(userId);
    const authorStatus = await getAuthorStatus(userId);

    if (hasRecord) {
      // User has author account but not active - redirect to auth page with status
      redirect(`/author-auth?status=${authorStatus || 'PENDING'}`);
    } else {
      // User has no author record - redirect to auth page to choose sign-in or apply
      redirect('/author-auth');
    }
  }

  return <AuthorShell>{children}</AuthorShell>;
}
