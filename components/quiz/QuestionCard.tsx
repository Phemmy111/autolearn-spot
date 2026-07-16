import { QuizQuestion } from '@/types/quiz'

interface QuestionCardProps {
  question: QuizQuestion
  answer: string
  onChange: (ans: string) => void
}

export function QuestionCard({ question, answer, onChange }: QuestionCardProps) {
  return (
    <div className="rounded-xl border border-[#1f2229] bg-[#0c0e12] p-6 shadow-2xl">
      <h3 className="mb-6 font-heading text-xl font-semibold text-[#e2e8e2] leading-relaxed">
        {question.questionText}
      </h3>

      {question.type === 'MCQ' && question.options && (
        <div className="flex flex-col gap-3">
          {question.options.map((opt, i) => {
            const isSelected = answer === opt
            return (
              <label
                key={i}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                  isSelected
                    ? 'border-[#00f0ff] bg-[#00f0ff]/10 text-[#00f0ff]'
                    : 'border-[#1f2229] bg-[#111317] text-[#b9cacb] hover:border-[#3b494b]'
                }`}
              >
                <div className={`flex h-5 w-5 items-center justify-center rounded-full border ${isSelected ? 'border-[#00f0ff]' : 'border-[#5d5f63]'}`}>
                  {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-[#00f0ff]" />}
                </div>
                <span className="font-mono text-sm">{opt}</span>
                {/* Hidden actual radio input for accessibility */}
                <input
                  type="radio"
                  name={`question-${question.number}`}
                  value={opt}
                  checked={isSelected}
                  onChange={() => onChange(opt)}
                  className="hidden"
                />
              </label>
            )
          })}
        </div>
      )}

      {question.type === 'OPEN_ENDED' && (
        <div className="flex flex-col gap-2">
          <textarea
            value={answer || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type your answer here... (Auto-saves as you type)"
            className="h-40 w-full resize-y rounded-lg border border-[#1f2229] bg-[#111317] p-4 font-mono text-sm text-[#e2e8e2] outline-none transition-colors focus:border-[#00f0ff]"
          />
        </div>
      )}
    </div>
  )
}
