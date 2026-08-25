'use client'

import { useState } from 'react'
import { Check, ChevronRight, Sparkles, Mail, Link, Hash, Clock, Calendar, X } from 'lucide-react'

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
    inputType?: 'select' | 'multi-select' | 'text' | 'email' | 'url' | 'number' | 'time' | 'date' | 'boolean'
  }
  onSelect: (value: string) => void
  disabled?: boolean
}

export function AlexInteractiveQuestion({ question, onSelect, disabled = false }: AlexInteractiveQuestionProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState('')

  const handleSelect = (value: string) => {
    if (disabled) return
    setSelected(value)
    onSelect(value)
  }

  const handleInputChange = (value: string) => {
    if (disabled) return
    setInputValue(value)
  }

  const handleInputSubmit = () => {
    if (disabled || !inputValue.trim()) return
    onSelect(inputValue.trim())
    setInputValue('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !disabled && inputValue.trim()) {
      handleInputSubmit()
    }
  }

  // Determine if this is a finite choice question
  const hasOptions = question.options && question.options.length > 0
  const inputType = question.inputType || 'text'

  // Render select/multi-select options
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

  // Render boolean input
  if (inputType === 'boolean') {
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

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleSelect('Yes')}
            disabled={disabled}
            className={`
              p-3 rounded-lg border text-center transition-all
              ${selected === 'Yes'
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                : 'bg-slate-900/50 border-slate-600 text-slate-300 hover:border-slate-500 hover:bg-slate-900'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            Yes
          </button>
          <button
            onClick={() => handleSelect('No')}
            disabled={disabled}
            className={`
              p-3 rounded-lg border text-center transition-all
              ${selected === 'No'
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                : 'bg-slate-900/50 border-slate-600 text-slate-300 hover:border-slate-500 hover:bg-slate-900'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            No
          </button>
        </div>
      </div>
    )
  }

  // Render typed input fields
  const getInputIcon = () => {
    switch (inputType) {
      case 'email': return <Mail className="h-4 w-4 text-slate-400" />
      case 'url': return <Link className="h-4 w-4 text-slate-400" />
      case 'number': return <Hash className="h-4 w-4 text-slate-400" />
      case 'time': return <Clock className="h-4 w-4 text-slate-400" />
      case 'date': return <Calendar className="h-4 w-4 text-slate-400" />
      default: return <Sparkles className="h-4 w-4 text-cyan-400" />
    }
  }

  const getInputType = () => {
    switch (inputType) {
      case 'email': return 'email'
      case 'url': return 'url'
      case 'number': return 'number'
      case 'time': return 'time'
      case 'date': return 'date'
      default: return 'text'
    }
  }

  return (
    <div className="my-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
      <div className="flex items-start gap-3 mb-4">
        {getInputIcon()}
        <div className="flex-1">
          <p className="text-slate-200 font-medium">{question.text}</p>
          {question.field && (
            <p className="text-xs text-slate-500 mt-1">Context: {question.field}</p>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type={getInputType()}
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={`Enter ${inputType}...`}
          disabled={disabled}
          className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-slate-300 placeholder-slate-500 focus:outline-none focus:border-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          onClick={handleInputSubmit}
          disabled={disabled || !inputValue.trim()}
          className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500 text-cyan-400 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-cyan-500/20"
        >
          Submit
        </button>
      </div>
    </div>
  )
}
