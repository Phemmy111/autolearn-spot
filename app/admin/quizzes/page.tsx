import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Plus, Edit, Eye, Clock, Target, Sparkles, ArrowLeft } from 'lucide-react'
import { DeleteQuizButton } from '@/components/admin/delete-quiz-button'

export const dynamic = 'force-dynamic'

export default async function AdminQuizzesPage() {
  try {
    await requireAdmin()
  } catch (error) {
    redirect('/')
  }

  const { data: quizzes, error } = await supabase
    .from('quizzes')
    .select('*, questions(count)')
    .order('week_number', { ascending: true })

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <p className="text-red-400 font-mono">Error loading quizzes: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="font-heading text-4xl font-bold text-[var(--text-primary)] mb-4">Manage Quizzes</h1>
              <p className="font-mono text-sm text-[var(--text-muted)]">Create and manage weekly quizzes</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/quizzes/generate"
              className="flex items-center gap-2 bg-[var(--primary-light)] text-[var(--primary)] font-bold uppercase tracking-wider font-mono px-6 py-2 rounded hover:bg-[#00f0ff]/20 transition-colors text-sm border border-[#00f0ff]/50"
            >
              <Sparkles className="h-4 w-4" />
              AI Generate
            </Link>
            <Link
              href="/admin/quizzes/new"
              className="flex items-center gap-2 bg-[#00f0ff] text-black font-bold uppercase tracking-wider font-mono px-6 py-2 rounded hover:bg-white transition-colors text-sm"
            >
              <Plus className="h-4 w-4" />
              New Quiz
            </Link>
          </div>
        </div>

        {quizzes && quizzes.length === 0 ? (
          <div className="text-center py-12 border border-[var(--border-default)] bg-[var(--card)] rounded-xl">
            <p className="font-mono text-sm text-[var(--text-muted)]">No quizzes yet. Create your first quiz!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {quizzes?.map((quiz: { id: string; title: string; week_number: number; is_active: boolean; passing_score: number }) => (
              <div
                key={quiz.id}
                className="border border-[var(--border-default)] bg-[var(--card)] p-6 rounded-xl hover:border-[var(--primary)] transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-[var(--primary-light)] text-[var(--primary)] font-mono text-xs rounded">
                        {quiz.phase}
                      </span>
                      <span className="px-2 py-1 bg-[var(--surface-hover)] text-[var(--text-muted)] font-mono text-xs rounded">
                        Week {quiz.week_number}
                      </span>
                      {!quiz.is_active && (
                        <span className="px-2 py-1 bg-red-500/10 text-red-400 font-mono text-xs rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                    <h3 className="font-heading text-xl font-bold text-[var(--text-primary)] mb-2">{quiz.title}</h3>
                    {quiz.description && (
                      <p className="font-mono text-sm text-[var(--text-muted)] mb-4">{quiz.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 mb-4 font-mono text-xs text-[#5d5f63]">
                  {quiz.time_limit && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{quiz.time_limit} mins</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    <span>Pass: {quiz.passing_score}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Questions: {quiz.questions?.[0]?.count || 0}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/quizzes/${quiz.id}`}
                    className="flex items-center gap-2 text-[var(--primary)] hover:text-[var(--text-primary)] font-mono text-xs uppercase tracking-wider transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Link>
                  <Link
                    href={`/quiz/${quiz.id}?preview=true`}
                    target="_blank"
                    className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] font-mono text-xs uppercase tracking-wider transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    Preview
                  </Link>
                  <Link
                    href={`/admin/quizzes/${quiz.id}/questions`}
                    className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] font-mono text-xs uppercase tracking-wider transition-colors"
                  >
                    Questions
                  </Link>
                  <DeleteQuizButton quizId={quiz.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
