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
 * 
 * A user can be BOTH a student and an author (same Clerk account).
 * We check the authors table for an ACTIVE record with this clerk_user_id.
 * If not found by ID, we try to link/re-link by email (handles the case where
 * the author applied before creating a Clerk account, or signed in on a different device).
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

  // Check if user is already an approved author by their Clerk user ID
  const approved = await isApprovedAuthor(userId);

  if (!approved) {
    // Get the full user object to retrieve their email for linking
    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress;

    if (email) {
      // Try to link or re-link author profile by email
      // (handles: applied without auth, or signed in from different browser)
      const linked = await linkAuthorProfile(userId, email);
      if (linked) {
        const approvedAfterLink = await isApprovedAuthor(userId);
        if (approvedAfterLink) {
          return <AuthorShell>{children}</AuthorShell>;
        }
      }
    }

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
