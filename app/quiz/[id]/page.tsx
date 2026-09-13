'use client'

import { useEffect, useState } from 'react'
import { useAuth, useUser } from '@clerk/nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import { fetchQuizById, submitQuiz } from '@/lib/api/quiz'
import { SupabaseQuiz, SupabaseQuestion } from '@/types/quiz'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { CheckCircle, XCircle, ArrowLeft, Clock, Target } from 'lucide-react'
import Link from 'next/link'

export default function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = useAuth()
  const { user } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [quiz, setQuiz] = useState<SupabaseQuiz | null>(null)
  const [questions, setQuestions] = useState<SupabaseQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [started, setStarted] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<{ score: number; percentage: number; passed: boolean; question_results?: any[] } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [quizId, setQuizId] = useState<string>('')

  useEffect(() => {
    async function loadParams() {
      const resolvedParams = await params
      setQuizId(resolvedParams.id)
    }
    loadParams()
  }, [params])

  useEffect(() => {
    if (!quizId) return

    async function loadQuiz() {
      const isPreview = searchParams.get('preview') === 'true'
      const data = await fetchQuizById(quizId, isPreview)
      if (data) {
        setQuiz(data.quiz)
        setQuestions(data.questions)
      } else {
        setError('Quiz not found')
      }
      setLoading(false)
    }
    loadQuiz()
  }, [quizId, searchParams])

  const startQuiz = () => {
    setStarted(true)
    setStartTime(new Date())
  }

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const [showConfirm, setShowConfirm] = useState(false)

  const handleSubmit = async () => {
    if (!userId || !quiz || !startTime) return

    // Validate all questions are answered
    const unansweredQuestions = questions.filter(q => !answers[q.id])
    if (unansweredQuestions.length > 0) {
      setShowConfirm(true)
      return
    }

    await confirmSubmit()
  }

  const confirmSubmit = async () => {
    setShowConfirm(false)
    setSubmitting(true)
    setError(null)

    const timeTaken = Math.floor((new Date().getTime() - startTime!.getTime()) / 1000)

    // Validate time limit (server-side will also validate)
    if (quiz!.time_limit && timeTaken > quiz!.time_limit * 60) {
      setError('Time limit exceeded. Quiz cannot be submitted.')
      setSubmitting(false)
      return
    }

    try {
      const result = await submitQuiz(quiz!.id, {
        user_name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Student',
        user_email: user?.emailAddresses[0]?.emailAddress || '',
        answers,
        time_taken: timeTaken,
        started_at: startTime!.toISOString(),
      })

      if (result.success) {
        setResult({
          score: result.score || 0,
          percentage: result.percentage || 0,
          passed: result.passed || false,
          question_results: result.question_results,
        })
        setSubmitted(true)
      } else {
        // Handle duplicate submission specifically
        if (result.error?.includes('already submitted')) {
          setError('You have already submitted this quiz. Each quiz can only be taken once.')
        } else {
          setError(result.error || 'Failed to submit quiz')
        }
      }
    } catch (err: any) {
      setError('Network error. Please check your connection and try again.')
      console.error('Quiz submission error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <LoadingSpinner message="Loading quiz..." />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[var(--card)] rounded-2xl shadow-xl border border-brand-border p-8 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-brand-text mb-2">Error</h2>
          <p className="text-brand-text/70 mb-6">{error}</p>
          <Link href="/quizzes" className="inline-flex items-center text-sky-600 hover:text-sky-700 font-medium">
            Back to Quizzes
          </Link>
        </div>
      </div>
    )
  }

  if (!quiz) {
    return null
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[var(--card)] rounded-2xl shadow-xl border border-brand-border p-8 text-center">
          <h2 className="text-2xl font-bold text-brand-text mb-4">Sign In Required</h2>
          <p className="text-brand-text/70 mb-6">You need to sign in to take this quiz.</p>
          <Link
            href="/sign-in"
            className="inline-flex items-center justify-center w-full bg-sky-600 text-white font-semibold px-8 py-3 rounded-xl hover:bg-sky-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  if (submitted && result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-[var(--card)] rounded-2xl shadow-xl border border-brand-border p-8">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${result.passed ? 'bg-emerald-50' : 'bg-red-50'}`}>
            {result.passed ? (
              <CheckCircle className="h-10 w-10 text-emerald-500" />
            ) : (
              <XCircle className="h-10 w-10 text-red-500" />
            )}
          </div>
          <h2 className="text-3xl font-bold text-brand-text text-center mb-2">
            {result.passed ? 'Quiz Passed!' : 'Quiz Not Passed'}
          </h2>
          <div className="flex justify-center gap-12 mb-8">
            <div className="text-center">
              <p className="text-brand-text/60 text-sm mb-1">Score</p>
              <p className="text-4xl font-bold text-brand-text">{result.score}</p>
            </div>
            <div className="text-center">
              <p className="text-brand-text/60 text-sm mb-1">Percentage</p>
              <p className="text-4xl font-bold text-brand-text">{result.percentage}%</p>
            </div>
          </div>
          <div className="flex justify-center gap-4 mb-8">
            <Link
              href="/quizzes"
              className="inline-flex items-center text-sky-600 hover:text-sky-700 font-medium"
            >
              Back to Quizzes
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center text-sky-600 hover:text-sky-700 font-medium"
            >
              Dashboard
            </Link>
          </div>

          {result.question_results && (
            <div className="mt-8 space-y-4">
              <h3 className="text-xl font-bold text-brand-text pb-4 border-b border-brand-border">
                Review Your Answers
              </h3>
              {result.question_results.map((q: any, i: number) => (
                <div
                  key={q.id || i}
                  className={`p-6 rounded-xl border ${
                    q.is_correct ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      {q.is_correct ? (
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-brand-text font-medium mb-3">
                        <span className="text-brand-text/60 mr-2">Q{i + 1}.</span>
                        {q.question_text}
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <span className="text-brand-text/60 min-w-[100px]">Your Answer:</span>
                          <span className={q.is_correct ? 'text-brand-primary font-medium' : 'text-red-600 font-medium'}>
                            {q.user_answer || '(No answer)'}
                          </span>
                        </div>
                        {!q.is_correct && (
                          <div className="flex items-start gap-2">
                            <span className="text-brand-text/60 min-w-[100px]">Correct:</span>
                            <span className="text-brand-primary font-medium">{q.correct_answer}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {q.explanation && (
                    <div className="mt-4 pt-4 border-t border-brand-border">
                      <p className="text-xs font-semibold text-brand-text/60 uppercase tracking-wider mb-2">Explanation</p>
                      <p className="text-sm text-brand-text/70 leading-relaxed">
                        {q.explanation}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-[var(--card)] rounded-2xl shadow-xl border border-brand-border p-8">
          <h2 className="text-3xl font-bold text-brand-text mb-4 text-center">{quiz.title}</h2>
          {quiz.description && (
            <p className="text-brand-text/70 mb-8 text-center">{quiz.description}</p>
          )}
          <div className="flex justify-center gap-8 mb-8 text-brand-text/70">
            {quiz.time_limit && (
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span>{quiz.time_limit} mins</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              <span>Pass: {quiz.passing_score}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Questions: {questions.length}</span>
            </div>
          </div>
          <button
            onClick={startQuiz}
            disabled={questions.length === 0}
            className="w-full bg-sky-600 text-white font-semibold px-8 py-4 rounded-xl hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {questions.length === 0 ? 'No Questions Yet' : 'Start Quiz'}
          </button>
        </div>
      </div>
    )
  }

  if (submitting) {
    return <LoadingSpinner message="Submitting your answers..." />
  }

  const currentQ = questions[currentQuestion]
  const options = currentQ.options ? (Array.isArray(currentQ.options) ? currentQ.options : JSON.parse(currentQ.options)) : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/quizzes" className="text-brand-text/60 hover:text-brand-text">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-brand-text">{quiz.title}</h2>
            <p className="text-sm text-brand-text/60 mt-1">
              Question {currentQuestion + 1} of {questions.length}
            </p>
          </div>
        </div>

        <div className="w-full bg-gray-200 h-2 rounded-full mb-8 overflow-hidden">
          <div
            className="bg-sky-600 h-full transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          />
        </div>

        <div className="bg-[var(--card)] rounded-2xl shadow-xl border border-brand-border p-8">
          <h3 className="text-lg font-semibold text-brand-text mb-6 leading-relaxed whitespace-pre-line">
            {currentQ.question_text}
          </h3>

          {currentQ.question_type === 'multiple_choice' && options.length > 0 && (
            <div className="flex flex-col gap-3">
              {options.map((opt: string, i: number) => {
                const isSelected = answers[currentQ.id] === opt
                return (
                  <label
                    key={i}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50 text-sky-700'
                        : 'border-brand-border bg-brand-bg text-gray-700 hover:border-brand-border'
                    }`}
                  >
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${isSelected ? 'border-sky-500' : 'border-brand-border'}`}>
                      {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-sky-500" />}
                    </div>
                    <span className="text-sm">{opt}</span>
                    <input
                      type="radio"
                      name={`question-${currentQ.id}`}
                      value={opt}
                      checked={isSelected}
                      onChange={() => handleAnswer(currentQ.id, opt)}
                      className="hidden"
                    />
                  </label>
                )
              })}
            </div>
          )}

          {currentQ.question_type === 'true_false' && (
            <div className="flex gap-4">
              {['True', 'False'].map((option) => {
                const isSelected = answers[currentQ.id] === option
                return (
                  <label
                    key={option}
                    className={`flex-1 cursor-pointer rounded-xl border p-4 text-center transition-all ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50 text-sky-700'
                        : 'border-brand-border bg-brand-bg text-gray-700 hover:border-brand-border'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQ.id}`}
                      value={option}
                      checked={isSelected}
                      onChange={() => handleAnswer(currentQ.id, option)}
                      className="hidden"
                    />
                    <span className="text-sm font-semibold">{option}</span>
                  </label>
                )
              })}
            </div>
          )}

          {currentQ.question_type === 'short_answer' && (
            <textarea
              value={answers[currentQ.id] || ''}
              onChange={(e) => handleAnswer(currentQ.id, e.target.value)}
              placeholder="Type your answer here..."
              className="h-40 w-full resize-y rounded-xl border border-brand-border bg-brand-bg p-4 text-sm text-brand-text outline-none transition-colors focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 placeholder:text-gray-400"
            />
          )}
        </div>

        <div className="flex justify-between items-center mt-8">
          <button
            onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0}
            className="flex items-center gap-2 text-brand-text/70 hover:text-brand-text disabled:opacity-30 disabled:cursor-not-allowed font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Previous
          </button>

          {currentQuestion === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-sky-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-sky-700 transition-colors disabled:opacity-50"
            >
              Submit Quiz
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestion((prev) => Math.min(questions.length - 1, prev + 1))}
              className="flex items-center gap-2 text-sky-600 hover:text-sky-700 font-medium transition-colors"
            >
              Next
            </button>
          )}
        </div>

        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-[var(--card)] rounded-2xl shadow-xl border border-brand-border p-8 text-center">
              <h2 className="text-2xl font-bold text-brand-text mb-4">Unanswered Questions</h2>
              <p className="text-brand-text/70 mb-8">
                You have {questions.filter(q => !answers[q.id]).length} questions left unanswered. Are you sure you want to submit?
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="text-brand-text/70 hover:text-brand-text font-medium px-6 py-3"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSubmit}
                  className="bg-sky-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-sky-700 transition-colors"
                >
                  Yes, Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
