'use client'

import { useState, useEffect } from 'react'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Plus, Edit, Trash2, Eye, Clock, Target, Sparkles, ArrowLeft } from 'lucide-react'

export default function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function checkAdmin() {
      try {
        await requireAdmin()
        setIsAdmin(true)
      } catch (err) {
        redirect('/')
      }
    }
    checkAdmin()
  }, [])

  useEffect(() => {
    if (!isAdmin) return

    async function loadQuizzes() {
      const { data: quizzes, error } = await supabase
        .from('quizzes')
        .select('*, questions(count)')
        .order('week_number', { ascending: true })

      if (error) {
        setError(error.message)
      } else {
        setQuizzes(quizzes || [])
      }
      setLoading(false)
    }
    loadQuizzes()
  }, [isAdmin])

  const handleDelete = async (quizId: string) => {
    if (!confirm('Are you sure you want to delete this quiz? This will also delete all questions and responses.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quizId)

      if (error) {
        setError(error.message)
        return
      }

      // Refresh the list
      const { data: quizzes } = await supabase
        .from('quizzes')
        .select('*, questions(count)')
        .order('week_number', { ascending: true })

      setQuizzes(quizzes || [])
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00f0ff]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0c10]">
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-[#b9cacb] hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="font-heading text-4xl font-bold text-white mb-4">Manage Quizzes</h1>
              <p className="font-mono text-sm text-[#b9cacb]">Create and manage weekly quizzes</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/quizzes/generate"
              className="flex items-center gap-2 bg-[#00f0ff]/10 text-[#00f0ff] font-bold uppercase tracking-wider font-mono px-6 py-2 rounded hover:bg-[#00f0ff]/20 transition-colors text-sm border border-[#00f0ff]/50"
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

        {error && (
          <div className="mb-6 border border-red-500/50 bg-red-500/10 p-4 rounded-lg">
            <p className="font-mono text-sm text-red-400">{error}</p>
          </div>
        )}

        {quizzes && quizzes.length === 0 ? (
          <div className="text-center py-12 border border-[#1f2229] bg-[#0c0e12] rounded-xl">
            <p className="font-mono text-sm text-[#b9cacb]">No quizzes yet. Create your first quiz!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {quizzes?.map((quiz: any) => (
              <div
                key={quiz.id}
                className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl hover:border-[#00f0ff]/50 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-[#00f0ff]/10 text-[#00f0ff] font-mono text-xs rounded">
                        {quiz.phase}
                      </span>
                      <span className="px-2 py-1 bg-[#1f2229] text-[#b9cacb] font-mono text-xs rounded">
                        Week {quiz.week_number}
                      </span>
                      {!quiz.is_active && (
                        <span className="px-2 py-1 bg-red-500/10 text-red-400 font-mono text-xs rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                    <h3 className="font-heading text-xl font-bold text-white mb-2">{quiz.title}</h3>
                    {quiz.description && (
                      <p className="font-mono text-sm text-[#b9cacb] mb-4">{quiz.description}</p>
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
                    className="flex items-center gap-2 text-[#00f0ff] hover:text-white font-mono text-xs uppercase tracking-wider transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Link>
                  <Link
                    href={`/quiz/${quiz.id}?preview=true`}
                    target="_blank"
                    className="flex items-center gap-2 text-[#b9cacb] hover:text-white font-mono text-xs uppercase tracking-wider transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    Preview
                  </Link>
                  <Link
                    href={`/admin/quizzes/${quiz.id}/questions`}
                    className="flex items-center gap-2 text-[#b9cacb] hover:text-white font-mono text-xs uppercase tracking-wider transition-colors"
                  >
                    Questions
                  </Link>
                  <button
                    onClick={() => handleDelete(quiz.id)}
                    className="flex items-center gap-2 text-red-400 hover:text-red-300 font-mono text-xs uppercase tracking-wider transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
