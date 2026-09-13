import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin'
import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, Lock, Unlock, Save, Check, X, AlertCircle } from 'lucide-react'
import { Metadata } from 'next'
import LessonSchedulerClient from './client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Lesson Scheduler | Admin | AutoLearn Spot',
  description: 'Manage video release schedules for each cohort.',
}

export default async function LessonSchedulerPage() {
  try {
    await requireAdmin()
  } catch {
    redirect('/admin')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-10">
          <Link
            href="/admin"
            className="mb-4 flex items-center gap-2 font-mono text-sm text-neutral-600 transition hover:text-neutral-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </Link>
          <h1 className="font-heading text-3xl font-bold text-neutral-900">
            Lesson Scheduler
          </h1>
          <p className="mt-2 font-mono text-sm text-neutral-600">
            Manage video release schedules for each cohort
          </p>
        </div>

        <LessonSchedulerClient />
      </div>
    </div>
  )
}
