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
    <div className="min-h-screen bg-[#0a0c10] flex">
      <AdminSidebar />
      <main className="flex-1 lg:ml-[230px]">
        {children}
      </main>
    </div>
  )
}
