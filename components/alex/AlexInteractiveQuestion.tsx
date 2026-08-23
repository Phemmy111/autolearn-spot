'use client'

import { useState } from 'react'
import { Check, ChevronRight, Sparkles } from 'lucide-react'

interface Option {
  label: string
  value: string
  description?: string
  recommended?: boolean
}

interface AlexInteractiveQuestionProps {
  question: {
    text: string
    field: string
    context: string
    options?: string[]
  }
  onSelect: (value: string) => void
  disabled?: boolean
}

export function AlexInteractiveQuestion({ question, onSelect, disabled = false }: AlexInteractiveQuestionProps) {
  const [selected, setSelected] = useState<string | null>(null)

  const handleSelect = (value: string) => {
    if (disabled) return
    setSelected(value)
    onSelect(value)
  }

  // Determine if this is a finite choice question
  const hasOptions = question.options && question.options.length > 0

  if (hasOptions) {
    return (
      <div className="my-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <div className="flex items-start gap-3 mb-4">
          <Sparkles className="h-5 w-5 text-cyan-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-slate-200 font-medium">{question.text}</p>
            {question.field && (
              <p className="text-xs text-slate-500 mt-1">Context: {question.field}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {question.options.map((option, index) => {
            const isRecommended = index === 0 // First option is recommended
            return (
              <button
                key={option}
                onClick={() => handleSelect(option)}
                disabled={disabled}
                className={`
                  relative p-3 rounded-lg border text-left transition-all
                  ${selected === option
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                    : 'bg-slate-900/50 border-slate-600 text-slate-300 hover:border-slate-500 hover:bg-slate-900'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {isRecommended && (
                  <div className="absolute -top-2 -right-2 bg-cyan-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                    Recommended
                  </div>
                )}
                <div className="flex items-center gap-2">
                  {selected === option ? (
                    <Check className="h-4 w-4 text-cyan-400" />
                  ) : (
                    <div className="h-4 w-4 border border-slate-500 rounded-sm" />
                  )}
                  <span className="text-sm font-medium">{option}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // For open-ended questions, we could add a text input
  // For now, fall back to requiring user to type response
  return null
}
