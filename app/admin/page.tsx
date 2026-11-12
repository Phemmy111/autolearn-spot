import { requireAdmin, isSuperAdmin } from '@/lib/admin'
import Link from 'next/link'
import {
  Plus,
  BookOpen,
  Users,
  BarChart3,
  Activity,
  Trophy,
  Shield,
  Bot,
  Star,
  Wallet,
  Award,
  GraduationCap,
  Sparkles,
  ExternalLink,
  ArrowRight,
  Clock,
  CheckCircle2
} from 'lucide-react'
import { ResetDataButton } from '@/components/admin/ResetDataButton'
import { CertificateToggle } from '@/components/admin/CertificateToggle'
import { CourseCompletionCard } from '@/components/admin/CourseCompletionCard'
import { SummaryCard } from '@/components/admin/SummaryCard'
import { supabaseAdmin } from '@/lib/supabase'
import { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Admin Dashboard | AutoLearn Spot',
  description: 'Manage platform metrics, student learning activity, courses, reviews, and payouts.',
}

export default async function AdminPage() {
  await requireAdmin()
  const isSuper = await isSuperAdmin()

  // Fetch recent enrollments for live activity feed
  const { data: recentEnrollments } = await supabaseAdmin
    .from('enrollments')
    .select('id, clerk_user_id, learning_product_id, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  const { data: products } = await supabaseAdmin
    .from('learning_products')
    .select('id, title');

  const prodMap = new Map((products || []).map(p => [p.id, p.title]));

  const hubLinks = [
    {
      title: 'Student Activities',
      description: 'Track lesson progress, course starts, and completion status.',
      href: '/admin/students/activities',
      icon: GraduationCap,
      color: 'text-sky-600',
      bgColor: 'bg-sky-50 dark:bg-sky-950/40',
      borderColor: 'hover:border-sky-500/50',
      badge: 'Real-time'
    },
    {
      title: 'Course Reviews',
      description: 'Moderate, approve, and feature live student reviews and star ratings.',
      href: '/admin/reviews',
      icon: Star,
      color: 'text-amber-500',
      bgColor: 'bg-amber-50 dark:bg-amber-950/40',
      borderColor: 'hover:border-amber-500/50',
      badge: 'Quality'
    },
    {
      title: 'Author Withdrawals',
      description: 'Review payout requests and mark payments as paid or rejected.',
      href: '/admin/withdrawals',
      icon: Wallet,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
      borderColor: 'hover:border-emerald-500/50',
      badge: 'Finance'
    },
    {
      title: 'Certificates Center',
      description: 'Audit issued certificates and manage student credential templates.',
      href: '/admin/certificates',
      icon: Award,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50 dark:bg-teal-950/40',
      borderColor: 'hover:border-teal-500/50',
      badge: 'Credentials'
    },
    {
      title: 'Platform Analytics',
      description: 'View sales velocity, conversion trends, and learner cohorts.',
      href: '/admin/analytics',
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/40',
      borderColor: 'hover:border-purple-500/50',
      badge: 'Insights'
    },
    {
      title: 'Quizzes & Testing',
      description: 'Create quizzes, adjust passing criteria, and manage question pools.',
      href: '/admin/quizzes',
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/40',
      borderColor: 'hover:border-blue-500/50',
      badge: 'Assessments'
    },
    {
      title: 'Student Leaderboard',
      description: 'See top quiz performers, XP milestones, and ranking metrics.',
      href: '/admin/leaderboard',
      icon: Trophy,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-950/40',
      borderColor: 'hover:border-orange-500/50',
      badge: 'Gamification'
    },
    {
      title: 'Authors & Creators',
      description: 'Manage instructor profiles, permissions, and partner revenue splits.',
      href: '/admin/authors',
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/40',
      borderColor: 'hover:border-indigo-500/50',
      badge: 'Instructors'
    }
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-brand-border">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <h1 className="font-heading text-3xl font-extrabold text-brand-text tracking-tight">Admin Overview</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>
          <p className="text-sm text-brand-text/70">
            Real-time platform metrics, student learning activity, reviews, and finance control.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/students/activities"
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded-xl hover:bg-brand-primary-hover transition-colors shadow-sm"
          >
            <GraduationCap className="w-4 h-4" />
            Student Activities
          </Link>
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-1.5 px-4 py-2 bg-[var(--card)] brightness-95 border border-brand-border text-brand-text text-xs font-semibold rounded-xl hover:bg-brand-bg transition-colors shadow-sm"
          >
            <span>Storefront</span>
            <ExternalLink className="w-3.5 h-3.5 text-brand-text/60" />
          </Link>
        </div>
      </div>

      {/* 1. Executive Summary Cards */}
      <section>
        <SummaryCard />
      </section>

      {/* 2. Management Command Hub */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-heading font-bold text-brand-text">Management Center</h2>
            <p className="text-xs text-brand-text/60">Quick shortcuts to manage all platform operations</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {hubLinks.map((hub, i) => {
            const Icon = hub.icon;
            return (
              <Link
                key={i}
                href={hub.href}
                className={`p-5 rounded-2xl border border-brand-border bg-[var(--card)] brightness-95 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group flex flex-col justify-between ${hub.borderColor}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-xl ${hub.bgColor} ${hub.color} transition-transform group-hover:scale-105`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-brand-bg text-brand-text/60 border border-brand-border">
                      {hub.badge}
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-brand-text text-base mb-1 group-hover:text-brand-primary transition-colors">
                    {hub.title}
                  </h3>
                  <p className="text-xs text-brand-text/60 leading-relaxed">
                    {hub.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-brand-border/60 flex items-center justify-end text-xs font-medium text-brand-text/60 group-hover:text-brand-primary transition-colors">
                  <span className="mr-1">Open</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. Live Recent Enrollments & Activities Feed */}
      <section className="border border-brand-border bg-[var(--card)] brightness-95 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-heading font-bold text-brand-text flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-primary" />
              Recent Student Enrollments
            </h2>
            <p className="text-xs text-brand-text/60">Real-time enrollments and learning access across published courses</p>
          </div>
          <Link
            href="/admin/students/activities"
            className="text-xs font-semibold text-brand-primary hover:underline flex items-center gap-1"
          >
            <span>View All Student Activities</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {(!recentEnrollments || recentEnrollments.length === 0) ? (
          <p className="text-xs text-brand-text/60 italic py-4 text-center">No student enrollments recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-brand-border text-brand-text/60 font-semibold uppercase tracking-wider">
                  <th className="pb-3 px-3">Student ID</th>
                  <th className="pb-3 px-3">Course Title</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Enrolled Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/60">
                {recentEnrollments.map((e) => (
                  <tr key={e.id} className="hover:bg-brand-bg/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-medium text-brand-text">
                      {e.clerk_user_id ? `${e.clerk_user_id.slice(0, 16)}...` : 'Student'}
                    </td>
                    <td className="py-3 px-3 font-semibold text-brand-text">
                      {prodMap.get(e.learning_product_id) || 'AI Automation with n8n'}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                        e.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${e.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {e.status?.replace('_', ' ') || 'active'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-brand-text/60">
                      {new Date(e.created_at).toLocaleDateString('en-NG', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 4. Course Completion Settings (Super Admin) */}
      {isSuper && (
        <section>
          <CourseCompletionCard />
        </section>
      )}

      {/* 5. System Utilities & Fast Actions */}
      <section className="border border-brand-border bg-[var(--card)] brightness-95 p-6 rounded-2xl shadow-sm">
        <h2 className="font-heading text-lg font-bold text-brand-text mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          System Actions & Utilities
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/quizzes/new"
            className="flex items-center gap-2 bg-brand-primary text-white font-bold uppercase tracking-wider font-mono px-5 py-2 rounded-xl hover:bg-brand-primary-hover transition-colors text-xs shadow-sm"
          >
            <Plus className="h-4 w-4" />
            New Quiz
          </Link>
          <CertificateToggle />
          {isSuper && (
            <Link 
              href="/admin/enrollments/manual"
              className="flex items-center gap-2 border border-brand-primary/40 bg-brand-primary/5 px-5 py-2 font-mono text-xs font-bold uppercase tracking-wider text-brand-primary hover:bg-brand-primary/10 transition-colors rounded-xl"
            >
              <Users className="h-4 w-4" />
              Manual Enrollment
            </Link>
          )}
          {isSuper && (
            <Link
              href="/admin/video-debug"
              className="flex items-center gap-2 border border-brand-border bg-brand-bg px-5 py-2 font-mono text-xs font-bold uppercase tracking-wider text-brand-text/70 hover:bg-[var(--card)] hover:text-brand-text transition-colors rounded-xl"
            >
              <Activity className="h-4 w-4" />
              Video Debug
            </Link>
          )}
          <Link
            href="/admin/alex-provider"
            className="flex items-center gap-2 border border-brand-border bg-brand-bg px-5 py-2 font-mono text-xs font-bold uppercase tracking-wider text-brand-text/70 hover:bg-[var(--card)] hover:text-brand-text transition-colors rounded-xl"
          >
            <Bot className="h-4 w-4" />
            ALEX Provider
          </Link>
          <ResetDataButton />
        </div>
      </section>
    </div>
  )
}
