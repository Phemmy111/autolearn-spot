import { requireAdmin, isSuperAdmin } from '@/lib/admin'
import Link from 'next/link'
import { Plus, BookOpen, Users, BarChart3, Activity, Trophy, Shield, Bot } from 'lucide-react'
import { ResetDataButton } from '@/components/admin/ResetDataButton'
import { CertificateToggle } from '@/components/admin/CertificateToggle'
import { CourseCompletionCard } from '@/components/admin/CourseCompletionCard'
import { SummaryCard } from '@/components/admin/SummaryCard'
import { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Admin Dashboard | AutoLearn Spot',
  description: 'Manage quizzes, questions, and view student results.',
}

export default async function AdminPage() {
  const isSuper = await isSuperAdmin()

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-brand-text mb-2">Dashboard</h1>
          <p className="font-mono text-sm text-brand-text/70">Overview of AutoLearn Spot platform metrics and activity</p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-2 bg-[var(--card)] brightness-95 border border-brand-border text-neutral-700 px-4 py-2 rounded-lg hover:bg-brand-bg transition-colors shadow-sm font-medium text-sm"
        >
          Back to Home
        </Link>
      </div>

      <SummaryCard />

      <div className="mt-8">
        {isSuper && (
          <div className="mb-8">
            <CourseCompletionCard />
          </div>
        )}

        <div className="border border-brand-border bg-[var(--card)] brightness-95 p-6 rounded-xl shadow-sm">
          <h2 className="font-heading text-xl font-bold text-brand-text mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/admin/quizzes/new"
              className="flex items-center gap-2 bg-brand-bg text-brand-text font-bold uppercase tracking-wider font-mono px-6 py-2 rounded hover:bg-brand-bg transition-colors text-sm shadow-sm"
            >
              <Plus className="h-4 w-4" />
              New Quiz
            </Link>
            <Link 
              href="/admin/quizzes"
              className="flex items-center gap-2 border border-brand-border bg-brand-bg px-6 py-2 font-mono text-xs font-bold uppercase tracking-wider text-brand-text/70 hover:bg-[var(--card)] brightness-95 hover:text-brand-text transition-colors rounded"
            >
              <BookOpen className="h-4 w-4" />
              Quizzes
            </Link>
            <Link 
              href="/admin/leaderboard"
              className="flex items-center gap-2 border border-brand-border bg-brand-bg px-6 py-2 font-mono text-xs font-bold uppercase tracking-wider text-brand-text/70 hover:bg-[var(--card)] brightness-95 hover:text-brand-text transition-colors rounded"
            >
              <Trophy className="h-4 w-4" />
              Leaderboard
            </Link>
            <Link 
              href="/admin/analytics"
              className="flex items-center gap-2 border border-brand-border bg-brand-bg px-6 py-2 font-mono text-xs font-bold uppercase tracking-wider text-brand-text/70 hover:bg-[var(--card)] brightness-95 hover:text-brand-text transition-colors rounded"
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </Link>
            <ResetDataButton />
            <CertificateToggle />
            {isSuper && (
              <Link 
                href="/admin/enrollments/manual"
                className="flex items-center gap-2 border border-[#10b981]/30 bg-brand-bg/10 px-6 py-2 font-mono text-xs font-bold uppercase tracking-wider text-[#10b981] hover:bg-brand-bg/20 transition-colors rounded"
              >
                <Users className="h-4 w-4" />
                Manual Enrollment
              </Link>
            )}
            {isSuper && (
              <Link
                href="/admin/video-debug"
                className="flex items-center gap-2 border border-[#10b981]/30 bg-brand-bg/10 px-6 py-2 font-mono text-xs font-bold uppercase tracking-wider text-[#10b981] hover:bg-brand-bg/20 transition-colors rounded"
              >
                <Activity className="h-4 w-4" />
                Video Debug
              </Link>
            )}
            <Link
              href="/admin/alex-provider"
              className="flex items-center gap-2 border border-[#10b981]/30 bg-brand-bg/10 px-6 py-2 font-mono text-xs font-bold uppercase tracking-wider text-[#10b981] hover:bg-brand-bg/20 transition-colors rounded"
            >
              <Bot className="h-4 w-4" />
              ALEX Provider
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
