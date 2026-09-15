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

  console.log('[Author Layout] userId:', userId);
  console.log('[Author Layout] approved:', approved);

  if (!approved) {
    // Try to link author profile by email (for users who applied without auth)
    const user = await auth();
    const email = user?.user?.emailAddresses?.[0]?.emailAddress;

    console.log('[Author Layout] email:', email);

    if (email) {
      const linked = await linkAuthorProfile(userId, email);
      console.log('[Author Layout] linked:', linked);
      if (linked) {
        // Retry approval check after linking
        const approvedAfterLink = await isApprovedAuthor(userId);
        console.log('[Author Layout] approvedAfterLink:', approvedAfterLink);
        if (approvedAfterLink) {
          return <AuthorShell>{children}</AuthorShell>;
        }
      }
    }

    // Not approved - redirect to auth page where they can choose sign-in or apply
    console.log('[Author Layout] Not approved, redirecting to auth page');
    redirect('/author-auth');
  }

  return <AuthorShell>{children}</AuthorShell>;
}
