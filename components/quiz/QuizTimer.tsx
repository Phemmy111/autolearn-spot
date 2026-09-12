import { Timer } from 'lucide-react'

interface QuizTimerProps {
  formattedTime: string
  timeLeft: number | null
}

export function QuizTimer({ formattedTime, timeLeft }: QuizTimerProps) {
  const isLowTime = timeLeft !== null && timeLeft < 60 // Less than 1 minute

  return (
    <div className={`flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-sm font-bold ${isLowTime ? 'border-red-500 bg-red-500/10 text-red-500 animate-pulse' : 'border-neutral-200 bg-gray-100] text-[#10b981]'}`}>
      <Timer className="h-4 w-4" />
      <span>{formattedTime}</span>
    </div>
  )
}
