import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

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
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
