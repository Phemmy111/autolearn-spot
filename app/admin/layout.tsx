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
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-[#d1d5db] flex text-gray-900 font-sans">
      <AdminSidebar />
      <main className="flex-1 lg:ml-64 w-full min-w-0">
        {children}
      </main>
    </div>
  )
}
