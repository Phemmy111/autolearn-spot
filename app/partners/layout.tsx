import { ReactNode } from 'react';

export default function PartnersLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col w-full max-w-full overflow-x-hidden">
      <div className="flex-1 min-w-0 w-full max-w-full">{children}</div>
    </div>
  );
}
