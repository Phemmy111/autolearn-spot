'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import {
  Users,
  Search,
  Mail,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Target,
  CalendarPlus,
  Infinity as InfinityIcon
} from 'lucide-react'
import ExtendAccessModal, { ExtendAccessStudent } from '@/components/shared/ExtendAccessModal'

interface Student {
  id: string
  email: string
  name: string | null
  cohort: string
  status: string
  profilePicture: string | null
  enrolledAt: string
  activatedAt: string | null
  expiresAt?: string | null
  days_left?: number | null
  is_lifetime?: boolean
  quizCount: number
  submissionCount: number
}

export default function AuthorStudentsPage() {
  const { userId } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [extendTarget, setExtendTarget] = useState<Student | null>(null)

  useEffect(() => {
    if (userId) fetchStudents()
  }, [userId])

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/author/students')
      const data = await res.json()

      if (data.success) {
        setStudents(data.students)
      } else {
        setError(data.error || 'Failed to load students')
      }
    } catch (err) {
      setError('Network error loading students')
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase()
    return (
      (s.name && s.name.toLowerCase().includes(q)) ||
      s.email.toLowerCase().includes(q) ||
      (s.cohort && s.cohort.toLowerCase().includes(q))
    )
  })

  const statusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-50 text-green-700'
      case 'pending':
        return 'bg-yellow-50 text-yellow-700'
      case 'expired':
        return 'bg-red-50 text-red-700'
      default:
        return 'bg-gray-50 text-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--card)]">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center text-brand-text/60 py-12">Loading students...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--card)]">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-brand-text">Students</h1>
            <p className="text-sm text-brand-text/70 mt-1">
              {students.length} enrolled student{students.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-text/60" />
          <input
            type="text"
            placeholder="Search by name, email, or course..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-brand-border bg-brand-bg text-brand-text placeholder-brand-text/50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {feedback && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300 px-4 py-3 rounded-xl mb-6 flex items-center justify-between text-xs font-bold animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>{feedback}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-muted-foreground hover:text-foreground">
              ✕
            </button>
          </div>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-brand-bg border border-brand-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-sky-600" />
              <span className="text-sm text-brand-text/70">Total</span>
            </div>
            <p className="text-2xl font-bold text-brand-text">{students.length}</p>
          </div>
          <div className="bg-brand-bg border border-brand-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm text-brand-text/70">Active</span>
            </div>
            <p className="text-2xl font-bold text-brand-text">
              {students.filter((s) => s.status === 'active').length}
            </p>
          </div>
          <div className="bg-brand-bg border border-brand-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-purple-600" />
              <span className="text-sm text-brand-text/70">Quizzes Taken</span>
            </div>
            <p className="text-2xl font-bold text-brand-text">
              {students.reduce((sum, s) => sum + s.quizCount, 0)}
            </p>
          </div>
          <div className="bg-brand-bg border border-brand-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-brand-text/70">Assignments</span>
            </div>
            <p className="text-2xl font-bold text-brand-text">
              {students.reduce((sum, s) => sum + s.submissionCount, 0)}
            </p>
          </div>
        </div>

        {/* Students List */}
        {filteredStudents.length === 0 ? (
          <div className="bg-[var(--card)] rounded-xl border border-brand-border p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-brand-bg rounded-full">
                <Users className="h-8 w-8 text-neutral-400" />
              </div>
              <h3 className="text-lg font-semibold text-brand-text">
                {searchQuery ? 'No students match your search' : 'No students enrolled yet'}
              </h3>
              <p className="text-brand-text/60">
                {searchQuery
                  ? 'Try a different search term'
                  : 'Students will appear here once they enroll in your courses'}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-[var(--card)] rounded-xl border border-brand-border overflow-hidden">
            {/* Table Header */}
            <div className="hidden sm:grid sm:grid-cols-[1fr_150px_130px_70px_70px_130px] gap-4 px-6 py-3 bg-brand-bg border-b border-brand-border text-xs font-semibold text-brand-text/60 uppercase tracking-wider">
              <span>Student</span>
              <span>Course</span>
              <span>Access Status</span>
              <span className="text-center">Quizzes</span>
              <span className="text-center">Assignments</span>
              <span className="text-right">Actions</span>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-brand-border">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  className="sm:grid sm:grid-cols-[1fr_150px_130px_70px_70px_130px] gap-4 px-6 py-4 items-center hover:bg-brand-bg/50 transition-colors"
                >
                  {/* Student Info */}
                  <div className="flex items-center gap-3 mb-2 sm:mb-0">
                    <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {student.profilePicture ? (
                        <img
                          src={student.profilePicture}
                          alt={student.name || student.email}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <span className="text-sky-600 font-semibold text-sm">
                          {(student.name || student.email).charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-brand-text truncate">
                        {student.name || 'Unknown'}
                      </p>
                      <p className="text-sm text-brand-text/70 truncate flex items-center gap-1">
                        <Mail className="h-3 w-3 flex-shrink-0" />
                        {student.email}
                      </p>
                    </div>
                  </div>

                  {/* Cohort */}
                  <div className="text-sm text-brand-text/70 mb-1 sm:mb-0 truncate" title={student.cohort}>
                    {student.cohort || '—'}
                  </div>

                  {/* Status / Access Details */}
                  <div className="mb-1 sm:mb-0">
                    {student.is_lifetime ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        <InfinityIcon className="w-3 h-3" /> Lifetime
                      </span>
                    ) : student.status === 'expired' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        <Clock className="w-3 h-3" /> Expired (0d)
                      </span>
                    ) : student.status === 'active' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" /> {student.days_left !== null && student.days_left !== undefined ? `${student.days_left}d left` : 'Active'}
                      </span>
                    ) : (
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusColor(student.status)}`}
                      >
                        {student.status.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  {/* Quiz Count */}
                  <div className="text-sm text-brand-text/70 text-center">
                    {student.quizCount}
                  </div>

                  {/* Submission Count */}
                  <div className="text-sm text-brand-text/70 text-center">
                    {student.submissionCount}
                  </div>

                  {/* Action: Extend Access */}
                  <div className="text-right">
                    <button
                      onClick={() => setExtendTarget(student)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition-all shadow-sm"
                      title="Add days or grant lifetime access"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" />
                      <span>+ Extend</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Extend Access Modal */}
      <ExtendAccessModal
        isOpen={!!extendTarget}
        onClose={() => setExtendTarget(null)}
        student={extendTarget ? {
          id: extendTarget.id,
          name: extendTarget.name || 'Student',
          email: extendTarget.email,
          course: extendTarget.cohort,
          status: extendTarget.status,
          expires_at: extendTarget.expiresAt,
          days_left: extendTarget.days_left,
          is_lifetime: extendTarget.is_lifetime,
        } : null}
        apiEndpoint="/api/author/students"
        onSuccess={(result) => {
          if (!extendTarget) return;
          setStudents(prev => prev.map(s => {
            if (s.id === extendTarget.id) {
              return {
                ...s,
                status: result.status,
                days_left: result.days_left,
                is_lifetime: result.is_lifetime,
                expiresAt: result.expires_at,
              };
            }
            return s;
          }));
          setFeedback(result.message || `Successfully extended course access for ${extendTarget.name}`);
          setTimeout(() => setFeedback(null), 5000);
        }}
      />
    </div>
  )
}
