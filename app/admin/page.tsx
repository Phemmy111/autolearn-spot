import { redirect } from 'next/navigation'
import { requireAdmin, isSuperAdmin } from '@/lib/admin'
import Link from 'next/link'
import { Plus, BookOpen, Users, BarChart3, Activity, Shield, Bot, Sparkles, HeartPulse, Settings as SettingsIcon, MessageSquare, ArrowLeft, Trophy, FileText, ClipboardList, FileCheck, LineChart, Calendar, Bug, Wrench, DollarSign, PlayCircle, GraduationCap } from 'lucide-react'
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
  try {
    await requireAdmin()
  } catch (error) {
    redirect('/')
  }

  const isSuper = await isSuperAdmin()

  return (
    <div className="min-h-screen bg-[#0a0c10]">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-[#b9cacb] hover:text-white font-mono text-sm mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="font-heading text-4xl font-bold text-white mb-4">Admin Dashboard</h1>
          <p className="font-mono text-sm text-[#b9cacb] max-w-2xl">
            Manage quizzes, questions, and view student results.
          </p>
        </div>

        <SummaryCard />

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/admin/quizzes"
            className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl hover:border-[#00f0ff]/50 transition-all group"
          >
            <BookOpen className="h-8 w-8 text-[#00f0ff] mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="font-heading text-xl font-bold text-white mb-2">Quizzes</h2>
            <p className="font-mono text-xs text-[#b9cacb]">Create and manage weekly quizzes</p>
          </Link>

          <Link
            href="/admin/results"
            className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl hover:border-[#00f0ff]/50 transition-all group"
          >
            <Users className="h-8 w-8 text-[#00f0ff] mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="font-heading text-xl font-bold text-white mb-2">Results</h2>
            <p className="font-mono text-xs text-[#b9cacb]">View student quiz results</p>
          </Link>

          <Link
            href="/admin/assignments"
            className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl hover:border-[#00f0ff]/50 transition-all group"
          >
            <FileText className="h-8 w-8 text-[#00f0ff] mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="font-heading text-xl font-bold text-white mb-2">Assignments</h2>
            <p className="font-mono text-xs text-[#b9cacb]">Create and review student assignments</p>
          </Link>

          <Link
            href="/admin/enrollments"
            className="border border-[#1f2229] bg-[#0c0c12] p-6 rounded-xl hover:border-[#00f0ff]/50 transition-all group"
          >
            <Users className="h-8 w-8 text-[#00f0ff] mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="font-heading text-xl font-bold text-white mb-2">Enrollments</h2>
            <p className="font-mono text-xs text-[#b9cacb]">View student enrollment data</p>
          </Link>

          <Link
            href="/admin/settings/pricing"
            className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl hover:border-[#00f0ff]/50 transition-all group"
          >
            <SettingsIcon className="h-8 w-8 text-[#00f0ff] mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="font-heading text-xl font-bold text-white mb-2">Pricing Settings</h2>
            <p className="font-mono text-xs text-[#b9cacb]">Manage Direct Enrollment course fee</p>
          </Link>

          <Link
            href="/admin/settings/commission"
            className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl hover:border-[#00f0ff]/50 transition-all group"
          >
            <DollarSign className="h-8 w-8 text-[#00f0ff] mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="font-heading text-xl font-bold text-white mb-2">Commission Settings</h2>
            <p className="font-mono text-xs text-[#b9cacb]">Manage partner commission rates</p>
          </Link>

          <Link
            href="/admin/settings/scholarship"
            className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl hover:border-[#00f0ff]/50 transition-all group"
          >
            <Sparkles className="h-8 w-8 text-[#00f0ff] mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="font-heading text-xl font-bold text-white mb-2">Scholarship Settings</h2>
            <p className="font-mono text-xs text-[#b9cacb]">Manage scholarship programme settings</p>
          </Link>

          <Link
            href="/admin/settings/partnership"
            className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl hover:border-[#00f0ff]/50 transition-all group"
          >
            <Users className="h-8 w-8 text-[#00f0ff] mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="font-heading text-xl font-bold text-white mb-2">Partnership Settings</h2>
            <p className="font-mono text-xs text-[#b9cacb]">Manage partnership programme settings</p>
          </Link>

          <Link
            href="/admin/leaderboard"
            className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl hover:border-[#00f0ff]/50 transition-all group"
          >
            <BarChart3 className="h-8 w-8 text-[#00f0ff] mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="font-heading text-xl font-bold text-white mb-2">Leaderboard</h2>
            <p className="font-mono text-xs text-[#b9cacb]">View student rankings</p>
          </Link>

          <Link
            href="/admin/analytics/progress"
            className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl hover:border-[#00f0ff]/50 transition-all group"
          >
            <LineChart className="h-8 w-8 text-[#00f0ff] mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="font-heading text-xl font-bold text-white mb-2">Student Progress Analytics</h2>
            <p className="font-mono text-xs text-[#b9cacb]">Monitor student engagement, completion rates, and learning trends</p>
          </Link>

          <Link
            href="/admin/health"
            className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl hover:border-[#00f0ff]/50 transition-all group"
          >
            <Activity className="h-8 w-8 text-[#00f0ff] mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="font-heading text-xl font-bold text-white mb-2">Health</h2>
            <p className="font-mono text-xs text-[#b9cacb]">System status and metrics</p>
          </Link>

          <Link
            href="/admin/scholarship"
            className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl hover:border-[#00f0ff]/50 transition-all group"
          >
            <Sparkles className="h-8 w-8 text-[#00f0ff] mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="font-heading text-xl font-bold text-white mb-2">Scholarship Applications</h2>
            <p className="font-mono text-xs text-[#b9cacb]">Manage scholarship applications and track status</p>
          </Link>

          <Link
            href="/admin/partners"
            className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl hover:border-[#00f0ff]/50 transition-all group lg:col-span-2"
          >
            <Users className="h-8 w-8 text-[#00f0ff] mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="font-heading text-xl font-bold text-white mb-2">Ambassadorship / Partners</h2>
            <p className="font-mono text-xs text-[#b9cacb]">Manage community and influencer partners, ambassadorship applications, and commissions</p>
          </Link>
        </div>

        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <Link
            href="/admin/admins"
            className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl hover:border-[#00f0ff]/50 transition-all group"
          >
            <Shield className="h-8 w-8 text-[#00f0ff] mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="font-heading text-xl font-bold text-white mb-2">Admin Users</h2>
            <p className="font-mono text-xs text-[#b9cacb]">Manage admin access and roles (Super Admin only)</p>
          </Link>

          <Link
            href="/admin/notifications"
            className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl hover:border-[#00f0ff]/50 transition-all group"
          >
            <MessageSquare className="h-8 w-8 text-[#00f0ff] mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="font-heading text-xl font-bold text-white mb-2">Notifications</h2>
            <p className="font-mono text-xs text-[#b9cacb]">Manage and send notifications</p>
          </Link>

          <Link
            href="/admin/logs"
            className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl hover:border-[#00f0ff]/50 transition-all group"
          >
            <ClipboardList className="h-8 w-8 text-[#00f0ff] mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="font-heading text-xl font-bold text-white mb-2">Audit Logs</h2>
            <p className="font-mono text-xs text-[#b9cacb]">View system audit logs and activity</p>
          </Link>

          <Link
            href="/admin/ai-providers"
            className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl hover:border-[#00f0ff]/50 transition-all group"
          >
            <Bot className="h-8 w-8 text-[#00f0ff] mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="font-heading text-xl font-bold text-white mb-2">AI Providers</h2>
            <p className="font-mono text-xs text-[#b9cacb]">Manage AI providers and API keys (Super Admin only)</p>
          </Link>

          <Link
            href="/admin/ai-prompts"
            className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl hover:border-[#00f0ff]/50 transition-all group"
          >
            <MessageSquare className="h-8 w-8 text-[#00f0ff] mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="font-heading text-xl font-bold text-white mb-2">AI Prompts</h2>
            <p className="font-mono text-xs text-[#b9cacb]">Manage AI prompts for quiz generation (Super Admin only)</p>
          </Link>

          <Link
            href="/admin/ai-cost-controls"
            className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl hover:border-[#00f0ff]/50 transition-all group"
          >
            <SettingsIcon className="h-8 w-8 text-[#00f0ff] mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="font-heading text-xl font-bold text-white mb-2">AI Cost Controls</h2>
            <p className="font-mono text-xs text-[#b9cacb]">Configure AI usage limits and costs (Super Admin only)</p>
          </Link>

          <Link
            href="/admin/live-schedule"
            className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl hover:border-[#00f0ff]/50 transition-all group"
          >
            <Calendar className="h-8 w-8 text-[#00f0ff] mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="font-heading text-xl font-bold text-white mb-2">Live Schedule</h2>
            <p className="font-mono text-xs text-[#b9cacb]">Manage live class schedule and times</p>
          </Link>

          <Link
            href="/admin/debug/runtime"
            className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl hover:border-[#00f0ff]/50 transition-all group"
          >
            <Bug className="h-8 w-8 text-[#00f0ff] mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="font-heading text-xl font-bold text-white mb-2">Runtime Debug</h2>
            <p className="font-mono text-xs text-[#b9cacb]">Debug scoring pipeline with runtime traces</p>
          </Link>

          <Link
            href="/admin/maintenance"
            className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl hover:border-[#00f0ff]/50 transition-all group"
          >
            <Wrench className="h-8 w-8 text-[#00f0ff] mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="font-heading text-xl font-bold text-white mb-2">Maintenance</h2>
            <p className="font-mono text-xs text-[#b9cacb]">System maintenance operations and data recalculation</p>
          </Link>

          <Link
            href="/admin/lessons"
            className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl hover:border-[#00f0ff]/50 transition-all group"
          >
            <PlayCircle className="h-8 w-8 text-[#00f0ff] mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="font-heading text-xl font-bold text-white mb-2">Lesson Scheduler</h2>
            <p className="font-mono text-xs text-[#b9cacb]">Manage video release schedules for each cohort</p>
          </Link>
        </div>

        {isSuper && (
          <div className="mt-8">
            <CourseCompletionCard />
          </div>
        )}

        <div className="mt-6">
          <Link
            href="/admin/ai-playground"
            className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl hover:border-[#00f0ff]/50 transition-all group flex items-center gap-4"
          >
            <Sparkles className="h-8 w-8 text-[#00f0ff] group-hover:scale-110 transition-transform" />
            <div>
              <h2 className="font-heading text-xl font-bold text-white mb-2">AI Playground</h2>
              <p className="font-mono text-xs text-[#b9cacb]">Test AI prompts and responses</p>
            </div>
          </Link>
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <Link
            href="/admin/ai-health"
            className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl hover:border-[#00f0ff]/50 transition-all group"
          >
            <HeartPulse className="h-8 w-8 text-[#00f0ff] mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="font-heading text-xl font-bold text-white mb-2">AI Health</h2>
            <p className="font-mono text-xs text-[#b9cacb]">Monitor AI provider performance and usage</p>
          </Link>

          <Link
            href="/admin/ai-cost-controls"
            className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl hover:border-[#00f0ff]/50 transition-all group"
          >
            <SettingsIcon className="h-8 w-8 text-[#00f0ff] mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="font-heading text-xl font-bold text-white mb-2">AI Cost Controls</h2>
            <p className="font-mono text-xs text-[#b9cacb]">Configure AI usage limits and parameters (Super Admin only)</p>
          </Link>
        </div>

        <div className="mt-12 border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl">
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
            <Link 
              href="/admin/rc-testing"
              className="flex items-center gap-2 border border-[#1f2229] bg-[#111317] px-6 py-2 font-mono text-xs font-bold uppercase tracking-wider text-[#b9cacb] hover:bg-[#1a1d24] hover:text-white transition-colors"
            >
              <FileCheck className="h-4 w-4" />
              RC Testing
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
