'use client'

import { useState, useCallback } from 'react'
import { Quiz, QuizSubmission } from '@/types/quiz'
import { useQuizProgress } from '@/hooks/useQuizProgress'
import { useCountdown } from '@/hooks/useCountdown'
import { QuizTimer } from './QuizTimer'
import { QuestionCard } from './QuestionCard'
import { submitQuiz } from '@/lib/api/quiz'
import { LoadingSpinner } from '../ui/LoadingSpinner'
import { CheckCircle, AlertCircle, ArrowLeft, ArrowRight, Send } from 'lucide-react'

interface QuizPlayerProps {
  quiz: Quiz
  user: { id: string; firstName: string | null; lastName: string | null; email: string }
}

export function QuizPlayer({ quiz, user }: QuizPlayerProps) {
  const { progress, isLoaded, setAnswer, startQuiz, clearProgress } = useQuizProgress(quiz.week)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleTimeUp = useCallback(async () => {
    if (!isSubmitted && !isSubmitting) {
      await handleSubmit()
    }
  }, [isSubmitted, isSubmitting])

  const { formattedTime, timeLeft } = useCountdown(progress.startedAt, quiz.duration, handleTimeUp)

  if (!isLoaded) return <LoadingSpinner message="Restoring session..." />

  // If quiz hasn't started, show intro
  if (!progress.startedAt && !isSubmitted) {
    return (
      <div className="mx-auto max-w-2xl text-center border border-[#1f2229] bg-[#0c0e12] p-8 rounded-xl shadow-xl">
        <h2 className="font-heading text-3xl font-bold text-white mb-4">{quiz.title}</h2>
        <p className="text-[#b9cacb] font-mono text-sm mb-6">{quiz.description}</p>
        <div className="flex justify-center gap-8 mb-8 font-mono text-sm text-[#00f0ff]">
          <div><strong>Duration:</strong> {quiz.duration} mins</div>
          <div><strong>Pass Mark:</strong> {quiz.passMark}%</div>
          <div><strong>Questions:</strong> {quiz.questions.length}</div>
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

  const handleSubmit = async () => {
    if (isSubmitting || isSubmitted) return
    setIsSubmitting(true)
    setSubmitError(null)

    const submission: QuizSubmission = {
      studentId: user.id,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Student',
      email: user.email,
      week: quiz.week,
      startedAt: progress.startedAt!,
      submittedAt: new Date().toISOString(),
      answers: quiz.questions.map((q) => ({
        number: q.number,
        type: q.type,
        answer: progress.answers[q.number] || '',
      })),
    }

    const success = await submitQuiz(submission)
    setIsSubmitting(false)

    if (success) {
      setIsSubmitted(true)
      clearProgress()
    } else {
      setSubmitError('Failed to submit quiz. Please try again.')
    }
  }

  if (isSubmitting) {
    return <LoadingSpinner message="Submitting your answers..." />
  }

  if (isSubmitted) {
    return (
      <div className="mx-auto max-w-2xl text-center border border-[#1f2229] bg-[#0c0e12] p-8 rounded-xl shadow-xl">
        <CheckCircle className="h-16 w-16 text-emerald-400 mx-auto mb-4" />
        <h2 className="font-heading text-2xl font-bold text-white mb-2">Quiz Submitted Successfully</h2>
        <p className="text-[#b9cacb] font-mono text-sm mb-6">Waiting for grading... Your results will be available shortly.</p>
        <a href="/dashboard" className="text-[#00f0ff] hover:underline font-mono text-sm">
          Return to Dashboard
        </a>
      </div>
    )
  }

  const currentQuestion = quiz.questions[currentIndex]

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="font-heading text-2xl font-bold text-white">{quiz.title}</h2>
          <p className="font-mono text-xs text-[#5d5f63] mt-1">Question {currentIndex + 1} of {quiz.questions.length}</p>
        </div>
        <QuizTimer formattedTime={formattedTime} timeLeft={timeLeft} />
      </div>

      <div className="w-full bg-[#1f2229] h-1.5 rounded-full mb-8 overflow-hidden">
        <div 
          className="bg-[#00f0ff] h-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / quiz.questions.length) * 100}%` }}
        />
      </div>

      {submitError && (
        <div className="mb-6 flex items-center gap-3 rounded bg-red-500/10 p-4 border border-red-500/50">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="font-mono text-sm text-red-400">{submitError}</p>
        </div>
      )}

      <QuestionCard 
        question={currentQuestion} 
        answer={progress.answers[currentQuestion.number] || ''}
        onChange={(ans) => setAnswer(currentQuestion.number, ans)}
      />

      <div className="flex justify-between items-center mt-8">
        <button
          onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 text-[#b9cacb] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed font-mono text-sm uppercase tracking-wider transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Previous
        </button>

        {currentIndex === quiz.questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 bg-[#00f0ff] text-black font-bold uppercase tracking-wider font-mono px-6 py-2 rounded hover:bg-white transition-colors"
          >
            Submit Quiz <Send className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={() => setCurrentIndex((prev) => Math.min(quiz.questions.length - 1, prev + 1))}
            className="flex items-center gap-2 text-[#00f0ff] hover:text-white font-mono text-sm uppercase tracking-wider transition-colors"
          >
            Next <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
