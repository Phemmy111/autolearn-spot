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
    field?: string
    context?: string
    options?: string[]
    // Enhanced interactive question support
    enrichedOptions?: Option[]
    inputType?: 'select' | 'multi-select' | 'text' | 'email' | 'url' | 'number' | 'time' | 'date' | 'boolean'
    header?: string
    reason?: string
  }
  onSelect: (value: string) => void
  disabled?: boolean
}

export function AlexInteractiveQuestion({ question, onSelect, disabled = false }: AlexInteractiveQuestionProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [selectedValues, setSelectedValues] = useState<string[]>([])

  const handleSelect = (value: string) => {
    if (disabled) return
    
    if (question.inputType === 'multi-select') {
      setSelectedValues(prev => {
        if (prev.includes(value)) {
          return prev.filter(v => v !== value)
        } else {
          return [...prev, value]
        }
      })
      return
    }

    setSelected(value)
    onSelect(value)
    
    // Send selection event with full context
    const event = new CustomEvent('alexQuestionAnswer', { 
      detail: { 
        field: question.field || 'general', 
        value,
        question: question.text,
        context: question.context || question.reason,
        header: question.header
      } 
    })
    window.dispatchEvent(event)
  }

  const handleMultiSubmit = () => {
    if (disabled || selectedValues.length === 0) return
    const valueStr = selectedValues.join(', ')
    onSelect(valueStr)
    
    // Send selection event with full context
    const event = new CustomEvent('alexQuestionAnswer', { 
      detail: { 
        field: question.field || 'general', 
        value: valueStr,
        question: question.text,
        context: question.context || question.reason,
        header: question.header
      } 
    })
    window.dispatchEvent(event)
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
  const hasOptions = (question.options && question.options.length > 0) || (question.enrichedOptions && question.enrichedOptions.length > 0)
  const inputType = question.inputType || 'text'
  const isMulti = inputType === 'multi-select'
  
  // Use enriched options if available, otherwise fall back to simple options
  const displayOptions = question.enrichedOptions || question.options?.map(opt => ({ label: opt, value: opt })) || []

  // Render select/multi-select options
  if (hasOptions) {
    return (
      <div className="my-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
        <div className="flex items-start gap-3 mb-4">
          <Sparkles className="h-5 w-5 text-cyan-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-slate-200 font-medium">{question.text}</p>
            {question.reason && (
              <p className="text-xs text-slate-400 mt-1">{question.reason}</p>
            )}
            {question.header && (
              <p className="text-xs text-slate-500 mt-1">{question.header}</p>
            )}
            {question.field && (
              <p className="text-xs text-slate-500 mt-1">Context: {question.field}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {displayOptions.map((option, index) => {
            const isRecommended = option.recommended || (!isMulti && index === 0)
            const displayLabel = option.label || option.value
            const displayValue = option.value
            
            const isSelected = isMulti ? selectedValues.includes(displayValue) : selected === displayValue

            return (
              <button
                key={displayValue}
                onClick={() => handleSelect(displayValue)}
                disabled={disabled}
                className={`
                  relative p-3 rounded-lg border text-left transition-all
                  ${isSelected
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
                  {isSelected ? (
                    <Check className="h-4 w-4 text-cyan-400" />
                  ) : (
                    <div className="h-4 w-4 border border-slate-500 rounded-sm" />
                  )}
                  <div className="flex-1">
                    <span className="text-sm font-medium">{displayLabel}</span>
                    {option.description && (
                      <p className="text-xs text-slate-400 mt-1">{option.description}</p>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
        {isMulti && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleMultiSubmit}
              disabled={disabled || selectedValues.length === 0}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                disabled || selectedValues.length === 0
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-cyan-500 hover:bg-cyan-600 text-white'
              }`}
            >
              Submit Selection
            </button>
          </div>
        )}
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
            {question.reason && (
              <p className="text-xs text-slate-400 mt-1">{question.reason}</p>
            )}
            {question.header && (
              <p className="text-xs text-slate-500 mt-1">{question.header}</p>
            )}
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
          {question.reason && (
            <p className="text-xs text-slate-400 mt-1">{question.reason}</p>
          )}
          {question.header && (
            <p className="text-xs text-slate-500 mt-1">{question.header}</p>
          )}
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
