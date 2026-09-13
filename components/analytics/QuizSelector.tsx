'use client'

import { useRouter } from 'next/navigation'
import { HelpCircle } from 'lucide-react'

interface Quiz {
  id: string
  title: string
  week_number: number
  is_active: boolean
}

export default function QuizSelector({ quizzes, selectedQuizId }: { quizzes: Quiz[]; selectedQuizId?: string }) {
  const router = useRouter()

  return (
    <div className="border border-neutral-200 bg-gray-50 rounded-xl p-6 mb-8">
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-sm">
          <label htmlFor="quizId" className="block font-mono text-xs text-[#5d5f63] uppercase tracking-wider mb-2">
            Select Quiz to Analyze
          </label>
          <select
            id="quizId"
            name="quizId"
            defaultValue={selectedQuizId || ''}
            className="w-full bg-gray-50 border border-neutral-200 rounded-lg p-3 text-neutral-900 font-mono text-sm focus:border-[#10b981] outline-none"
            onChange={(e) => {
              if (e.target.value) {
                router.push(`/admin/analytics?quizId=${e.target.value}`)
              }
            }}
          >
            <option value="" disabled>-- Select a Quiz --</option>
            {quizzes?.map(q => (
              <option key={q.id} value={q.id}>
                Week {q.week_number}: {q.title}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-6 flex items-center gap-2 text-neutral-500 font-mono text-xs">
          <HelpCircle className="h-4 w-4 text-[#10b981]" />
          <span>Select a quiz to view question difficulty metrics.</span>
        </div>
      </div>
    </div>
  )
}
