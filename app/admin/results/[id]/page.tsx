import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle, User, Clock, FileText } from 'lucide-react'

export default async function AdminParticipantReviewPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
  } catch {
    redirect('/')
  }

  const { id } = await params

  // 1. Fetch the submission
  const { data: response, error: responseError } = await supabaseAdmin
    .from('quiz_responses')
    .select('*, quizzes(title, week_number)')
    .eq('id', id)
    .single()

  if (responseError || !response) {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
        <p className="text-red-400 font-mono">Submission not found.</p>
      </div>
    )
  }

  // 2. Fetch the questions for this quiz
  const { data: questions, error: questionsError } = await supabaseAdmin
    .from('questions')
    .select('*')
    .eq('quiz_id', response.quiz_id)
    .order('order_index', { ascending: true })

  if (questionsError || !questions) {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
        <p className="text-red-400 font-mono">Failed to load questions.</p>
      </div>
    )
  }

  const answers = response.answers || {}

  return (
    <div className="min-h-screen bg-[#0a0c10]">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link
          href="/admin/results"
          className="flex items-center gap-2 text-[#b9cacb] hover:text-white font-mono text-sm mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Results
        </Link>

        {/* Header */}
        <div className="border border-[#1f2229] bg-[#0c0e12] rounded-xl p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <User className="h-6 w-6 text-[#00f0ff]" />
                <h1 className="font-heading text-2xl font-bold text-white">{response.user_name}</h1>
              </div>
              <p className="font-mono text-sm text-[#b9cacb] mb-4">{response.user_email}</p>
              
              <div className="flex items-center gap-4 font-mono text-xs text-[#5d5f63]">
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  <span>{response.quizzes?.title} (Week {response.quizzes?.week_number})</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>
                    {response.time_taken ? `${Math.floor(response.time_taken / 60)}m ${response.time_taken % 60}s` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="font-mono text-xs text-[#5d5f63] uppercase tracking-wider mb-1">Score</p>
                <p className="font-mono text-2xl font-bold text-[#00f0ff]">
                  {response.score}<span className="text-[#5d5f63] text-sm">/{response.total_points}</span>
                </p>
              </div>
              <div className="text-center">
                <p className="font-mono text-xs text-[#5d5f63] uppercase tracking-wider mb-1">Status</p>
                {response.passed ? (
                  <div className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 px-3 py-1 rounded">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-mono text-sm font-bold">{response.percentage}% Passed</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-400 bg-red-400/10 px-3 py-1 rounded">
                    <XCircle className="h-4 w-4" />
                    <span className="font-mono text-sm font-bold">{response.percentage}% Failed</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Review */}
        <h2 className="font-heading text-xl font-bold text-white mb-6">Detailed Review</h2>
        
        <div className="space-y-6">
          {questions.map((q: any, i: number) => {
            const userAnswer = (answers[q.id] || '').trim()
            const correctAnswer = (q.correct_answer || '').trim()
            
            // Basic matching logic (could be synced with the robust submit API logic if needed)
            let isCorrect = userAnswer === correctAnswer

            if (!isCorrect && q.question_type === 'multiple_choice') {
               const correctLetterMatch = correctAnswer.match(/^[A-D](?:\.|\))?$/i)
               if (correctLetterMatch) {
                  const letter = correctAnswer.charAt(0).toUpperCase()
                  if (userAnswer.toUpperCase().startsWith(`${letter}.`) || userAnswer.toUpperCase().startsWith(`${letter})`) || userAnswer.toUpperCase().startsWith(`${letter} `)) {
                    isCorrect = true
                  }
               }
               // Add simple substring matching as fallback
               if (!isCorrect && userAnswer.length > 2 && correctAnswer.length > 2) {
                  const cleanUser = userAnswer.toLowerCase().replace(/^[a-d][.)]\s*/, '').trim()
                  const cleanCorrect = correctAnswer.toLowerCase().replace(/^[a-d][.)]\s*/, '').trim()
                  if (cleanUser === cleanCorrect || cleanUser.includes(cleanCorrect) || cleanCorrect.includes(cleanUser)) {
                    isCorrect = true
                  }
               }
            }

            return (
              <div
                key={q.id}
                className={`p-6 rounded-xl border ${
                  isCorrect ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'
                }`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="mt-1">
                    {isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-heading text-[#e2e8e2] mb-3 leading-relaxed">
                      <span className="text-[#5d5f63] font-mono mr-2 text-sm">Q{i + 1}.</span>
                      {q.question_text}
                    </p>
                    <div className="space-y-2 font-mono text-sm">
                      <div className="flex items-start gap-2">
                        <span className="text-[#5d5f63] min-w-[120px]">Student Answer:</span>
                        <span className={isCorrect ? 'text-emerald-400' : 'text-red-400'}>
                          {userAnswer || '(No answer provided)'}
                        </span>
                      </div>
                      {!isCorrect && (
                        <div className="flex items-start gap-2">
                          <span className="text-[#5d5f63] min-w-[120px]">Correct Answer:</span>
                          <span className="text-emerald-400">{correctAnswer}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {q.explanation && (
                  <div className="mt-4 pt-4 border-t border-[#1f2229]/50">
                    <p className="font-mono text-xs uppercase tracking-wider text-[#b9cacb] mb-2">Explanation</p>
                    <p className="font-mono text-sm text-[#8b949e] leading-relaxed">
                      {q.explanation}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
