import { ReactNode } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

/**
 * Admin Shell
 * 
 * Preserves existing admin functionality while establishing a clean admin shell.
 * Wraps the existing AdminSidebar and provides the main content area.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50 flex">
      <AdminSidebar />
      <main className="flex-1 lg:ml-[230px]">
        {children}
      </main>
    </div>
  );
}