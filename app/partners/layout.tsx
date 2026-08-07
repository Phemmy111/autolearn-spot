import { ReactNode } from 'react';

export default function PartnersLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <main className="flex-1">{children}</main>
    </div>
  );
}
