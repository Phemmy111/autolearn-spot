import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { isApprovedAuthor } from '@/lib/author';
import Link from 'next/link';
import { trackAuthentication } from '@/lib/auth-tracking';

export default async function AuthorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    redirect('/sign-in');
  }

  const primaryEmail = user.primaryEmailAddress?.emailAddress;
  if (!primaryEmail) {
    redirect('/sign-in');
  }

  // Ensure user is an approved author
  const approved = await isApprovedAuthor(userId);
  if (!approved) {
    redirect('/dashboard');
  }

  // Track login activity
  await trackAuthentication();

  return (
    <div className="flex min-h-screen bg-[#111317]">
      <nav className="w-64 bg-[#1a1d23] text-white p-4">
        <ul className="space-y-2">
          <li>
            <Link href="/author" className="block py-2 hover:text-primary-500">Overview</Link>
          </li>
          <li>
            <Link href="/author/products" className="block py-2 hover:text-primary-500">Products</Link>
          </li>
          <li>
            <Link href="/author/students" className="block py-2 hover:text-primary-500">Students</Link>
          </li>
          <li>
            <Link href="/author/earnings" className="block py-2 hover:text-primary-500">Earnings</Link>
          </li>
          <li>
            <Link href="/author/transactions" className="block py-2 hover:text-primary-500">Transactions</Link>
          </li>
          <li>
            <Link href="/author/bank-profile" className="block py-2 hover:text-primary-500">Bank Profile</Link>
          </li>
          <li>
            <span className="block py-2">Withdrawals</span>
            <ul className="ml-4 space-y-1">
              <li>
                <Link href="/author/withdrawals/request" className="block py-1 hover:text-primary-500">Request Withdrawal</Link>
              </li>
              <li>
                <Link href="/author/withdrawals/history" className="block py-1 hover:text-primary-500">Withdrawal History</Link>
              </li>
            </ul>
          </li>
          <li className="mt-8 border-t border-gray-700 pt-4">
            <Link href="/dashboard" className="block py-2 text-gray-400 hover:text-white">← Switch to Student</Link>
          </li>
        </ul>
      </nav>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
