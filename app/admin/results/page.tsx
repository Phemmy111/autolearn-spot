import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import { CheckCircle, XCircle, Clock, User } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminResultsPage() {
  try {
    await requireAdmin()
  } catch (error) {
    redirect('/')
  }

  const { data: responses, error } = await supabaseAdmin
    .from('quiz_responses')
    .select('*, quizzes(title, week_number)')
    .order('completed_at', { ascending: false })
    .limit(50)

  if (error) {
    return (
      <div className="min-h-screen bg-[bg-[var(--background)]] flex items-center justify-center">
        <p className="text-red-400 font-mono">Error loading results: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[bg-[var(--background)]]">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="font-heading text-4xl font-bold text-[var(--text-primary)] mb-4">Quiz Results</h1>
          <p className="font-mono text-sm text-[text-[var(--text-muted)]]">View all student quiz submissions and results</p>
        </div>

        {responses && responses.length === 0 ? (
          <div className="text-center py-12 border border-[border-[var(--border-default)]] bg-[bg-[var(--card)]] rounded-xl">
            <p className="font-mono text-sm text-[text-[var(--text-muted)]]">No quiz results yet.</p>
          </div>
        ) : (
          <div className="border border-[border-[var(--border-default)]] bg-[bg-[var(--card)]] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[border-[var(--border-default)]] bg-[bg-[var(--card)]]">
                  <th className="px-6 py-4 text-left font-mono text-xs uppercase tracking-wider text-[text-[var(--text-muted)]]">
                    Student
                  </th>
                  <th className="px-6 py-4 text-left font-mono text-xs uppercase tracking-wider text-[text-[var(--text-muted)]]">
                    Quiz
                  </th>
                  <th className="px-6 py-4 text-left font-mono text-xs uppercase tracking-wider text-[text-[var(--text-muted)]]">
                    Score
                  </th>
                  <th className="px-6 py-4 text-left font-mono text-xs uppercase tracking-wider text-[text-[var(--text-muted)]]">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left font-mono text-xs uppercase tracking-wider text-[text-[var(--text-muted)]]">
                    Time
                  </th>
                  <th className="px-6 py-4 text-left font-mono text-xs uppercase tracking-wider text-[text-[var(--text-muted)]]">
                    Submitted
                  </th>
                  <th className="px-6 py-4 text-left font-mono text-xs uppercase tracking-wider text-[text-[var(--text-muted)]]">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {responses?.map((response: { id: string; user_name: string | null; percentage: number; passed: boolean; created_at: string }) => (
                  <tr key={response.id} className="border-b border-[border-[var(--border-default)]] hover:bg-[bg-[var(--card)]] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-[text-[var(--text-muted)]]" />
                        <div>
                          <p className="font-mono text-sm text-[var(--text-primary)]">{response.user_name}</p>
                          <p className="font-mono text-xs text-[text-[var(--text-muted)]]">{response.user_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-mono text-sm text-[var(--text-primary)]">{response.quizzes?.title}</p>
                      <p className="font-mono text-xs text-[text-[var(--text-muted)]]">Week {response.quizzes?.week_number}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-lg font-bold text-[text-[var(--primary)]]">{response.score}</span>
                        <span className="font-mono text-xs text-[text-[var(--text-muted)]]">/ {response.total_points}</span>
                        <span className="font-mono text-xs text-[text-[var(--text-muted)]]">({response.percentage}%)</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {response.passed ? (
                        <div className="flex items-center gap-2 text-emerald-400">
                          <CheckCircle className="h-4 w-4" />
                          <span className="font-mono text-xs font-bold">Passed</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-red-400">
                          <XCircle className="h-4 w-4" />
                          <span className="font-mono text-xs font-bold">Failed</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-[text-[var(--text-muted)]]">
                        <Clock className="h-4 w-4" />
                        <span className="font-mono text-sm">
                          {response.time_taken ? `${Math.floor(response.time_taken / 60)}m ${response.time_taken % 60}s` : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-mono text-sm text-[text-[var(--text-muted)]]">
                        {new Date(response.completed_at).toLocaleDateString()}
                      </p>
                      <p className="font-mono text-xs text-[text-[var(--text-muted)]]">
                        {new Date(response.completed_at).toLocaleTimeString()}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <Link 
                          href={`/admin/results/${response.id}`}
                          className="text-[text-[var(--primary)]] hover:text-[var(--text-primary)] font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1"
                        >
                          Review
                        </Link>
                        {response.passed && (
                          <div className="flex gap-2">
                            <a
                              href={`/api/certificate/download?format=pdf&name=${encodeURIComponent(response.user_name || 'Student')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-400 hover:text-[var(--text-primary)] font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1"
                              title="Download PDF"
                            >
                              PDF
                            </a>
                            <a
                              href={`/api/certificate/download?format=png&name=${encodeURIComponent(response.user_name || 'Student')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-400 hover:text-[var(--text-primary)] font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1"
                              title="Download PNG"
                            >
                              PNG
                            </a>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
