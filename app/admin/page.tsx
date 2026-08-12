import { requireAdmin, isSuperAdmin } from '@/lib/admin'
import Link from 'next/link'
import { Plus, BookOpen, Users, BarChart3, Activity, Trophy, Shield } from 'lucide-react'
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
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="font-mono text-sm text-[#b9cacb]">Overview of AutoLearn Spot platform metrics and activity</p>
      </div>

      <SummaryCard />

      <div className="mt-8">
        {isSuper && (
          <div className="mb-8">
            <CourseCompletionCard />
          </div>
        )}

        <div className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl">
          <h2 className="font-heading text-xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/admin/quizzes/new"
              className="flex items-center gap-2 bg-[#00f0ff] text-black font-bold uppercase tracking-wider font-mono px-6 py-2 rounded hover:bg-white transition-colors text-sm"
            >
              <Plus className="h-4 w-4" />
              New Quiz
            </Link>
            <Link 
              href="/admin/quizzes"
              className="flex items-center gap-2 border border-[#1f2229] bg-[#111317] px-6 py-2 font-mono text-xs font-bold uppercase tracking-wider text-[#b9cacb] hover:bg-[#1a1d24] hover:text-white transition-colors"
            >
              <BookOpen className="h-4 w-4" />
              Quizzes
            </Link>
            <Link 
              href="/admin/leaderboard"
              className="flex items-center gap-2 border border-[#1f2229] bg-[#111317] px-6 py-2 font-mono text-xs font-bold uppercase tracking-wider text-[#b9cacb] hover:bg-[#1a1d24] hover:text-white transition-colors"
            >
              <Trophy className="h-4 w-4" />
              Leaderboard
            </Link>
            <Link 
              href="/admin/analytics"
              className="flex items-center gap-2 border border-[#1f2229] bg-[#111317] px-6 py-2 font-mono text-xs font-bold uppercase tracking-wider text-[#b9cacb] hover:bg-[#1a1d24] hover:text-white transition-colors"
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </Link>
            <ResetDataButton />
            <CertificateToggle />
            {isSuper && (
              <Link 
                href="/admin/enrollments/manual"
                className="flex items-center gap-2 border border-[#00f0ff]/50 bg-[#00f0ff]/10 px-6 py-2 font-mono text-xs font-bold uppercase tracking-wider text-[#00f0ff] hover:bg-[#00f0ff]/20 transition-colors rounded"
              >
                <Users className="h-4 w-4" />
                Manual Enrollment
              </Link>
            )}
            {isSuper && (
              <Link
                href="/admin/video-debug"
                className="flex items-center gap-2 border border-[#00f0ff]/50 bg-[#00f0ff]/10 px-6 py-2 font-mono text-xs font-bold uppercase tracking-wider text-[#00f0ff] hover:bg-[#00f0ff]/20 transition-colors rounded"
              >
                <Activity className="h-4 w-4" />
                Video Debug
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
