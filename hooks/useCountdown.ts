import { useState, useEffect } from 'react'

export function useCountdown(startedAt: string | null, durationMinutes: number, onTimeUp: () => void) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  useEffect(() => {
    if (!startedAt) {
      setTimeLeft(durationMinutes * 60)
      return
    }

    const interval = setInterval(() => {
      const now = new Date().getTime()
      const start = new Date(startedAt).getTime()
      const elapsedSeconds = Math.floor((now - start) / 1000)
      const totalSeconds = durationMinutes * 60
      const remaining = totalSeconds - elapsedSeconds

      if (remaining <= 0) {
        setTimeLeft(0)
        clearInterval(interval)
        onTimeUp()
      } else {
        setTimeLeft(remaining)
      }
    }, 1000)

    // Run immediately once to avoid 1s delay
    const now = new Date().getTime()
    const start = new Date(startedAt).getTime()
    const elapsedSeconds = Math.floor((now - start) / 1000)
    const remaining = durationMinutes * 60 - elapsedSeconds
    
    if (remaining <= 0) {
      setTimeLeft(0)
      onTimeUp()
    } else {
      setTimeLeft(remaining)
    }

    return () => clearInterval(interval)
  }, [startedAt, durationMinutes, onTimeUp])

  const formattedTime = timeLeft !== null ? 
    `${Math.floor(timeLeft / 60).toString().padStart(2, '0')}:${(timeLeft % 60).toString().padStart(2, '0')}` 
    : '--:--'

  return { timeLeft, formattedTime }
}
