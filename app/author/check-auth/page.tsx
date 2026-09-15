import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { isApprovedAuthor, hasAuthorRecord, getAuthorStatus, linkAuthorProfile } from '@/lib/author';

/**
 * Post-Authentication Check Page
 * 
 * This page handles the redirect after sign-in:
 * - If approved author → redirect to /author dashboard
 * - If has author record but not active → redirect to /author-auth with status
 * - If no author record → redirect to /author-apply
 * 
 * A user can be both a student and an author (same Clerk account).
 */
export default async function CheckAuthPage() {
  const { userId } = await auth();

  console.log('[CheckAuth] userId:', userId);

  if (!userId) {
    console.log('[CheckAuth] No userId, redirecting to sign-in');
    redirect('/author-sign-in');
  }

  // Get the full Clerk user object to access email
  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress;

  console.log('[CheckAuth] email:', email);

  if (email) {
    // Try to link or re-link author profile by email
    // (handles: applied without auth, signed in from different browser/device)
    const linked = await linkAuthorProfile(userId, email);
    console.log('[CheckAuth] linked:', linked);
    if (linked) {
      const approvedAfterLink = await isApprovedAuthor(userId);
      console.log('[CheckAuth] approvedAfterLink:', approvedAfterLink);
      if (approvedAfterLink) {
        console.log('[CheckAuth] Redirecting to author dashboard after link');
        redirect('/author');
      }
    }
  }

  // Check if user is an approved author (already linked)
  const approved = await isApprovedAuthor(userId);
  console.log('[CheckAuth] approved:', approved);
  
  if (approved) {
    console.log('[CheckAuth] Redirecting to author dashboard');
    redirect('/author');
  }

  // Check if user has an author record (pending/rejected/suspended)
  const hasRecord = await hasAuthorRecord(userId);
  const authorStatus = await getAuthorStatus(userId);

  console.log('[CheckAuth] hasRecord:', hasRecord);
  console.log('[CheckAuth] authorStatus:', authorStatus);

  if (hasRecord) {
    console.log('[CheckAuth] Redirecting to author-auth with status:', authorStatus);
    redirect(`/author-auth?status=${authorStatus || 'PENDING'}`);
  } else {
    console.log('[CheckAuth] No author record found, redirecting to author-apply');
    redirect('/author-apply');
  }
}