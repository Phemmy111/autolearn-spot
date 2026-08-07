import { QuizQuestion } from '@/types/quiz'

interface QuestionCardProps {
  question: QuizQuestion
  answer: string
  onChange: (ans: string) => void
}

export function QuestionCard({ question, answer, onChange }: QuestionCardProps) {
  const isOpenEnded = question.type === 'Open-ended' || question.type === 'OPEN_ENDED'
  const isMCQ = question.type === 'MCQ'

  // Extract just the label (A, B, C, D) from an option string like "A. i only"
  const extractLabel = (option: string): string => {
    const match = option.match(/^([A-Z])\./)
    return match ? match[1] : option
  }

  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--card)] p-6 shadow-sm">
      {/* Render question text, preserving \n line breaks */}
      <h3 className="mb-6 font-heading text-lg font-semibold text-[var(--text-primary)] leading-relaxed whitespace-pre-line">
        {question.question}
      </h3>

      {isMCQ && question.options && question.options.length > 0 && (
        <div className="flex flex-col gap-3">
          {question.options.map((opt, i) => {
            const label = extractLabel(opt)
            const isSelected = answer === label
            return (
              <label
                key={i}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                  isSelected
                    ? 'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]'
                    : 'border-[var(--border-default)] bg-[var(--background)] text-[var(--text-body)] hover:border-[var(--border-input)] hover:bg-[var(--surface-hover)]'
                }`}
              >
                <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${isSelected ? 'border-[var(--primary)]' : 'border-[var(--border-input)]'}`}>
                  {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-[var(--primary)]" />}
                </div>
                <span className="font-mono text-sm">{opt}</span>
                <input
                  type="radio"
                  name={`question-${question.number}`}
                  value={label}
                  checked={isSelected}
                  onChange={() => onChange(label)}
                  className="hidden"
                />
              </label>
            )
          })}
        </div>
      )}

      {isOpenEnded && (
        <div className="flex flex-col gap-2">
          <textarea
            value={answer || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type your answer here... (Auto-saves as you type)"
            className="h-40 w-full resize-y rounded-lg border border-[var(--border-input)] bg-[var(--background)] p-4 font-mono text-sm text-[var(--text-body)] outline-none transition-colors focus:border-[var(--primary)] placeholder:text-[var(--text-placeholder)]"
          />
        </div>
      )}
    </div>
  )
}
