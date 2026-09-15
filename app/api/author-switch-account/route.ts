import { NextResponse } from 'next/server';

/**
 * Author Account Switch Route
 *
 * Signs the current user out of their Clerk session and redirects
 * them to the author sign-in page with a fresh Clerk sign-in form.
 *
 * We use Clerk's signOut redirect URL by pointing the browser to
 * Clerk's hosted sign-out endpoint, then bouncing back to /author-sign-in.
 */
export async function GET() {
  // Redirect to Clerk's sign-out page; after sign-out Clerk redirects to `redirect_url`
  const afterSignOutUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://autolearn-spot.vercel.app'}/author-sign-in`;

  // We can't call Clerk's server-side signOut here and redirect cleanly in a GET,
  // so we redirect to the sign-out page passing the return URL.
  return NextResponse.redirect(
    `https://accounts.autolearn-spot.vercel.app/sign-out?redirect_url=${encodeURIComponent(afterSignOutUrl)}`,
    { status: 302 }
  );
}
