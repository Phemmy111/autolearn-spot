'use client'

import { useEffect, useRef, useState } from 'react'
import { Message } from '@/lib/alex/types'
import { Loader2, Bot, User, Copy, Check } from 'lucide-react'

interface AlexMessageListProps {
  messages: Message[]
  isLoading: boolean
}

export function AlexMessageList({ messages, isLoading }: AlexMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Enhanced Markdown rendering with XSS protection
  const renderMarkdown = (content: string) => {
    const safeContent = content
      // Escape HTML to prevent XSS
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      // Code blocks with language support and copy button
      .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        const language = lang || 'text'
        const codeId = `code-${Math.random().toString(36).substr(2, 9)}`
        return `
          <div class="relative group">
            <div class="flex items-center justify-between text-xs text-[#b9cacb] mb-2">
              <span class="capitalize">${language}</span>
              <button 
                onclick="copyCode('${codeId}')"
                class="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 hover:text-[#00f0ff]"
                title="Copy code"
              >
                <span id="${codeId}-text">${copiedCode === codeId ? 'Copied!' : 'Copy'}</span>
                ${copiedCode === codeId ? '<Check class="h-3 w-3 text-green-400"/>' : '<Copy class="h-3 w-3"/>'}
              </button>
            </div>
            <pre class="bg-[#070B12] rounded-lg p-4 my-4 overflow-x-auto"><code id="${codeId}" class="text-sm">${code}</code></pre>
          </div>
        `
      })
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="bg-[#1f2229] px-1.5 py-0.5 rounded text-[#00f0ff]">$1</code>')
      // Bold
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      // Headers
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
      // Lists
      .replace(/^\- (.*$)/gm, '<li class="ml-4">$1</li>')
      // Line breaks
      .replace(/\n/g, '<br />')
      
    return safeContent
  }

  const handleCopyCode = (codeId: string) => {
    const codeElement = document.getElementById(codeId)
    if (codeElement) {
      navigator.clipboard.writeText(codeElement.textContent || '')
      setCopiedCode(codeId)
      setTimeout(() => setCopiedCode(null), 2000)
    }
  }

  // Add copy function to window for onclick handlers
  useEffect(() => {
    ;(window as any).copyCode = handleCopyCode
    return () => {
      delete (window as any).copyCode
    }
  }, [copiedCode])

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {messages.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#00f0ff]/10 rounded-full mb-4">
              <Bot className="h-8 w-8 text-[#00f0ff]" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Welcome to ALEX</h2>
            <p className="text-[#b9cacb]">Your AutoLearn Intelligence & Execution Agent</p>
            <p className="text-sm text-[#b9cacb] mt-4">Select a mode and start a conversation to get started.</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-[#00f0ff]/10 rounded-lg flex items-center justify-center">
                  <Bot className="h-4 w-4 text-[#00f0ff]" />
                </div>
              </div>
            )}
            
            <div
              className={`max-w-2xl rounded-lg px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-[#00f0ff] text-[#00363a]'
                  : 'bg-[#1f2229] text-white'
              }`}
            >
              <div 
                className="prose prose-invert prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
              />
            </div>

            {message.role === 'user' && (
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-[#00f0ff] rounded-lg flex items-center justify-center">
                  <User className="h-4 w-4 text-[#00363a]" />
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-4 justify-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-[#00f0ff]/10 rounded-lg flex items-center justify-center">
                <Bot className="h-4 w-4 text-[#00f0ff]" />
              </div>
            </div>
            <div className="bg-[#1f2229] rounded-lg px-4 py-3">
              <Loader2 className="h-4 w-4 text-[#b9cacb] animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}