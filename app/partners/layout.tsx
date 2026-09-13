import { ReactNode } from 'react';

export default function PartnersLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1">{children}</main>
    </div>
  );
}
