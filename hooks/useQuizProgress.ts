import { useState, useEffect, useCallback } from 'react'

export interface QuizProgressState {
  startedAt: string | null
  answers: Record<number, string>
}

export function useQuizProgress(week: number) {
  const storageKey = `autolearn-quiz-progress-week-${week}`

  const [progress, setProgress] = useState<QuizProgressState>({
    startedAt: null,
    answers: {},
  })
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        setProgress(JSON.parse(stored))
      }
    } catch (e) {
      console.error('Error loading quiz progress', e)
    } finally {
      setIsLoaded(true)
    }
  }, [storageKey])

  // Save to local storage on change
  useEffect(() => {
    if (!isLoaded) return
    localStorage.setItem(storageKey, JSON.stringify(progress))
  }, [progress, isLoaded, storageKey])

  const setAnswer = useCallback((questionNumber: number, answer: string) => {
    setProgress((prev) => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionNumber]: answer,
      },
    }))
  }, [])

  const startQuiz = useCallback(() => {
    setProgress((prev) => {
      if (prev.startedAt) return prev
      return { ...prev, startedAt: new Date().toISOString() }
    })
  }, [])

  const clearProgress = useCallback(() => {
    localStorage.removeItem(storageKey)
    setProgress({ startedAt: null, answers: {} })
  }, [storageKey])

  return {
    progress,
    isLoaded,
    setAnswer,
    startQuiz,
    clearProgress,
  }
}
