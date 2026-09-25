import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/admin';

/**
 * Admin Post-Authentication Check Page
 *
 * This page handles the redirect after sign-in:
 * - If the signed-in user is an admin → redirect to /admin dashboard
 * - If NOT admin → redirect to /admin-sign-in?status=NOT_ADMIN
 *
 * Anyone can hold a Clerk account; only those with admin privileges
 * (ADMIN_EMAILS env var or `admins` table) are allowed through.
 */
export default async function AdminCheckAuthPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/admin-sign-in');
  }

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? '';

  console.log('[AdminCheckAuth] userId:', userId, 'email:', email);

  const admin = await isAdmin();

  console.log('[AdminCheckAuth] isAdmin:', admin);

  if (admin) {
    console.log('[AdminCheckAuth] ✅ Admin verified – redirecting to dashboard');
    redirect('/admin');
  }

  // Not an admin — send them back with a clear error
  console.log('[AdminCheckAuth] ❌ Not an admin – redirecting with NOT_ADMIN status');
  redirect('/admin-sign-in?status=NOT_ADMIN');
}
