import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { isApprovedAuthor, hasAuthorRecord, getAuthorStatus, linkAuthorProfile } from '@/lib/author';

/**
 * Post-Authentication Check Page
 * 
 * This page handles the redirect after sign-in:
 * - If approved author → redirect to /author dashboard
 * - If has author record but not active → redirect to /author-auth with status
 * - If no author record → redirect to /author-apply
 */
export default async function CheckAuthPage() {
  const { userId } = await auth();

  if (!userId) {
    // Not authenticated, redirect to sign-in
    redirect('/author-sign-in');
  }

  // Try to link author profile by email (for users who applied without auth)
  const user = await auth();
  const email = user?.user?.emailAddresses?.[0]?.emailAddress;

  if (email) {
    const linked = await linkAuthorProfile(userId, email);
    if (linked) {
      // Retry approval check after linking
      const approvedAfterLink = await isApprovedAuthor(userId);
      if (approvedAfterLink) {
        redirect('/author');
      }
    }
  }

  // Check if user is an approved author
  const approved = await isApprovedAuthor(userId);
  
  if (approved) {
    // User is approved author, send to dashboard
    redirect('/author');
  }

  // Check if user has an author record
  const hasRecord = await hasAuthorRecord(userId);
  const authorStatus = await getAuthorStatus(userId);

  if (hasRecord) {
    // User has author account but not active - redirect to auth page with status
    redirect(`/author-auth?status=${authorStatus || 'PENDING'}`);
  } else {
    // User has no author record - redirect to apply
    redirect('/author-apply');
  }
}