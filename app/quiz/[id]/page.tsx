'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { fetchQuizById, submitQuiz } from '@/lib/api/quiz'
import { SupabaseQuiz, SupabaseQuestion } from '@/types/quiz'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { CheckCircle, XCircle, ArrowLeft, Clock, Target } from 'lucide-react'
import Link from 'next/link'

export default function QuizPage({ params }: { params: { id: string } }) {
  const { userId, user } = useAuth()
  const router = useRouter()
  const [quiz, setQuiz] = useState<SupabaseQuiz | null>(null)
  const [questions, setQuestions] = useState<SupabaseQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [started, setStarted] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<{ score: number; percentage: number; passed: boolean } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadQuiz() {
      const data = await fetchQuizById(params.id)
      if (data) {
        setQuiz(data.quiz)
        setQuestions(data.questions)
      } else {
        setError('Quiz not found')
      }
      setLoading(false)
    }
    loadQuiz()
  }, [params.id])

  const startQuiz = () => {
    setStarted(true)
    setStartTime(new Date())
  }

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const handleSubmit = async () => {
    if (!userId || !quiz || !startTime) return

    // Validate all questions are answered
    const unansweredQuestions = questions.filter(q => !answers[q.id])
    if (unansweredQuestions.length > 0) {
      setError(`Please answer all questions before submitting. ${unansweredQuestions.length} question(s) remaining.`)
      return
    }

    setSubmitting(true)
    setError(null)

    const timeTaken = Math.floor((new Date().getTime() - startTime.getTime()) / 1000)

    // Validate time limit (server-side will also validate)
    if (quiz.time_limit && timeTaken > quiz.time_limit * 60) {
      setError('Time limit exceeded. Quiz cannot be submitted.')
      setSubmitting(false)
      return
    }

    try {
      const result = await submitQuiz(quiz.id, {
        user_name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Student',
        user_email: user?.emailAddresses[0]?.emailAddress || '',
        answers,
        time_taken: timeTaken,
        started_at: startTime.toISOString(),
      })

      if (result.success) {
        setResult({
          score: result.score || 0,
          percentage: result.percentage || 0,
          passed: result.passed || false,
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
      <div className="mx-auto max-w-2xl text-center border border-red-500/50 bg-red-500/10 p-8 rounded-xl">
        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="font-heading text-2xl font-bold text-white mb-2">Error</h2>
        <p className="font-mono text-sm text-[#b9cacb] mb-6">{error}</p>
        <Link href="/quizzes" className="text-[#00f0ff] hover:underline font-mono text-sm">
          Back to Quizzes
        </Link>
      </div>
    )
  }

  if (!quiz) {
    return null
  }

  if (!userId) {
    return (
      <div className="mx-auto max-w-2xl text-center border border-[#1f2229] bg-[#0c0e12] p-8 rounded-xl">
        <h2 className="font-heading text-2xl font-bold text-white mb-4">Sign In Required</h2>
        <p className="font-mono text-sm text-[#b9cacb] mb-6">You need to sign in to take this quiz.</p>
        <Link
          href="/sign-in"
          className="bg-[#00f0ff] text-black font-bold uppercase tracking-wider font-mono px-8 py-3 rounded hover:bg-white transition-colors"
        >
          Sign In
        </Link>
      </div>
    )
  }

  if (submitted && result) {
    return (
      <div className="mx-auto max-w-2xl text-center border border-[#1f2229] bg-[#0c0e12] p-8 rounded-xl">
        {result.passed ? (
          <CheckCircle className="h-16 w-16 text-emerald-400 mx-auto mb-4" />
        ) : (
          <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
        )}
        <h2 className="font-heading text-2xl font-bold text-white mb-2">
          {result.passed ? 'Quiz Passed!' : 'Quiz Not Passed'}
        </h2>
        <div className="flex justify-center gap-8 mb-6 font-mono text-sm">
          <div className="text-center">
            <p className="text-[#b9cacb]">Score</p>
            <p className="text-2xl font-bold text-[#00f0ff]">{result.score}</p>
          </div>
          <div className="text-center">
            <p className="text-[#b9cacb]">Percentage</p>
            <p className="text-2xl font-bold text-[#00f0ff]">{result.percentage}%</p>
          </div>
        </div>
        <div className="flex justify-center gap-4">
          <Link
            href="/quizzes"
            className="text-[#00f0ff] hover:underline font-mono text-sm"
          >
            Back to Quizzes
          </Link>
          <Link
            href="/dashboard"
            className="text-[#00f0ff] hover:underline font-mono text-sm"
          >
            Dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (!started) {
    return (
      <div className="mx-auto max-w-2xl text-center border border-[#1f2229] bg-[#0c0e12] p-8 rounded-xl shadow-xl">
        <h2 className="font-heading text-3xl font-bold text-white mb-4">{quiz.title}</h2>
        {quiz.description && (
          <p className="text-[#b9cacb] font-mono text-sm mb-6">{quiz.description}</p>
        )}
        <div className="flex justify-center gap-8 mb-8 font-mono text-sm text-[#00f0ff]">
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
          <div>
            <strong>Questions:</strong> {questions.length}
          </div>
        </div>
        <button
          onClick={startQuiz}
          className="bg-[#00f0ff] text-black font-bold uppercase tracking-wider font-mono px-8 py-3 rounded hover:bg-white transition-colors"
        >
          Start Quiz
        </button>
      </div>
    )
  }

  if (submitting) {
    return <LoadingSpinner message="Submitting your answers..." />
  }

  const currentQ = questions[currentQuestion]
  const options = currentQ.options ? JSON.parse(currentQ.options) : []

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/quizzes" className="text-[#b9cacb] hover:text-white">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h2 className="font-heading text-2xl font-bold text-white">{quiz.title}</h2>
          <p className="font-mono text-xs text-[#5d5f63] mt-1">
            Question {currentQuestion + 1} of {questions.length}
          </p>
        </div>
      </div>

      <div className="w-full bg-[#1f2229] h-1.5 rounded-full mb-8 overflow-hidden">
        <div
          className="bg-[#00f0ff] h-full transition-all duration-300"
          style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="rounded-xl border border-[#1f2229] bg-[#0c0e12] p-6 shadow-2xl">
        <h3 className="mb-6 font-heading text-lg font-semibold text-[#e2e8e2] leading-relaxed whitespace-pre-line">
          {currentQ.question_text}
        </h3>

        {currentQ.question_type === 'multiple_choice' && options.length > 0 && (
          <div className="flex flex-col gap-3">
            {options.map((opt: string, i: number) => {
              const isSelected = answers[currentQ.id] === opt
              return (
                <label
                  key={i}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                    isSelected
                      ? 'border-[#00f0ff] bg-[#00f0ff]/10 text-[#00f0ff]'
                      : 'border-[#1f2229] bg-[#111317] text-[#b9cacb] hover:border-[#3b494b]'
                  }`}
                >
                  <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${isSelected ? 'border-[#00f0ff]' : 'border-[#5d5f63]'}`}>
                    {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-[#00f0ff]" />}
                  </div>
                  <span className="font-mono text-sm">{opt}</span>
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
                  className={`flex-1 cursor-pointer rounded-lg border p-4 text-center transition-colors ${
                    isSelected
                      ? 'border-[#00f0ff] bg-[#00f0ff]/10 text-[#00f0ff]'
                      : 'border-[#1f2229] bg-[#111317] text-[#b9cacb] hover:border-[#3b494b]'
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
                  <span className="font-mono text-sm font-bold">{option}</span>
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
            className="h-40 w-full resize-y rounded-lg border border-[#1f2229] bg-[#111317] p-4 font-mono text-sm text-[#e2e8e2] outline-none transition-colors focus:border-[#00f0ff] placeholder:text-[#5d5f63]"
          />
        )}
      </div>

      <div className="flex justify-between items-center mt-8">
        <button
          onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
          disabled={currentQuestion === 0}
          className="flex items-center gap-2 text-[#b9cacb] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed font-mono text-sm uppercase tracking-wider transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Previous
        </button>

        {currentQuestion === questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-[#00f0ff] text-black font-bold uppercase tracking-wider font-mono px-6 py-2 rounded hover:bg-white transition-colors disabled:opacity-50"
          >
            Submit Quiz
          </button>
        ) : (
          <button
            onClick={() => setCurrentQuestion((prev) => Math.min(questions.length - 1, prev + 1))}
            className="flex items-center gap-2 text-[#00f0ff] hover:text-white font-mono text-sm uppercase tracking-wider transition-colors"
          >
            Next
          </button>
        )}
      </div>
    </div>
  )
}
