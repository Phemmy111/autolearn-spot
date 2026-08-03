import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function PartnersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in?redirect_url=/partners');
  }

  return (
    <div className="min-h-screen bg-[#0a0c10] flex flex-col">
      <main className="flex-1">{children}</main>
    </div>
  );
}
