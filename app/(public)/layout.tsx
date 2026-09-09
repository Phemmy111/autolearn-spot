import { ReactNode } from 'react';
import { PublicNavigation } from '@/components/shells/PublicNavigation';
import { PublicFooter } from '@/components/shells/PublicFooter';

/**
 * PUBLIC Layout Shell
 * 
 * Clean public navigation, footer, and responsive mobile navigation
 * for the marketplace and public-facing pages.
 */
export default function PublicLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <PublicNavigation />
      <main className="flex-1">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}