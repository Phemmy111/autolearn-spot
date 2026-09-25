import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    await requireAdmin()
  } catch (error) {
    redirect('/admin-sign-in')
  }

  return (
    <div className="min-h-screen bg-brand-bg flex text-brand-text font-sans">
      <AdminSidebar />
      <main className="flex-1 lg:ml-64 w-full min-w-0">
        {children}
      </main>
    </div>
  )
}
