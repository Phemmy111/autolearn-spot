import { redirect } from 'next/navigation'
import { requireSuperAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, UserPlus } from 'lucide-react'
import { ManualEnrollmentForm } from '@/components/admin/ManualEnrollmentForm'

export const dynamic = 'force-dynamic'

export default async function ManualEnrollmentPage() {
  try {
    await requireSuperAdmin()
  } catch (error) {
    redirect('/admin')
  }

  // Fetch active cohorts for the dropdown
  const { data: cohorts, error: cohortsError } = await supabaseAdmin
    .from('cohorts')
    .select('id, name, is_current')
    .order('created_at', { ascending: false })

  if (cohortsError) {
    return (
      <div className="min-h-screen bg-gray-100] flex items-center justify-center text-red-400">
        Error loading cohorts: {cohortsError.message}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100]">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="mb-8">
          <Link
            href="/admin/enrollments"
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 font-mono text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Enrollments
          </Link>
          <div className="flex items-center gap-3">
            <UserPlus className="h-8 w-8 text-[#10b981]" />
            <h1 className="font-heading text-4xl font-bold text-neutral-900">Manual Enrollment</h1>
          </div>
          <p className="font-mono text-sm text-neutral-600 mt-4">
            Manually enroll a student into a cohort, completely bypassing the payment system. This action is restricted to Super Admins only.
          </p>
        </div>

        <div className="border border-neutral-200 bg-gray-100 p-8 rounded-xl">
          <ManualEnrollmentForm cohorts={cohorts || []} />
        </div>
      </div>
    </div>
  )
}
