'use client'

import { useEffect, useRef, useState } from 'react'
import { Message } from '@/lib/alex/types'
import { Loader2, Bot, User, Copy, Check, AlertCircle, Sparkles, Lightbulb, BookOpen, Award, Workflow, Search, Zap, ThumbsUp, ThumbsDown, Edit2, X } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface AlexMessageListProps {
  messages: Message[]
  isLoading: boolean
  isGenerating?: boolean
  isMobile?: boolean
  onEditMessage?: (messageId: string, newContent: string) => void
  onRegenerateResponse?: (messageId: string) => void
}

export function AlexMessageList({ messages, isLoading, isGenerating = false, isMobile = false, onEditMessage, onRegenerateResponse }: AlexMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [feedback, setFeedback] = useState<Record<string, 'up' | 'down' | null>>({})
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle code copy
  const handleCopyCode = (code: string, codeId: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(codeId)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  // Handle copy entire message
  const handleCopyMessage = (content: string, messageId: string) => {
    navigator.clipboard.writeText(content)
    setCopiedCode(messageId)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  // Handle feedback
  const handleFeedback = (messageId: string, type: 'up' | 'down') => {
    setFeedback(prev => ({
      ...prev,
      [messageId]: prev[messageId] === type ? null : type
    }))
  }

  // Handle start edit
  const handleStartEdit = (messageId: string, content: string) => {
    setEditingMessageId(messageId)
    setEditContent(content)
  }

  // Handle save edit
  const handleSaveEdit = () => {
    if (editingMessageId && onEditMessage) {
      onEditMessage(editingMessageId, editContent)
    }
    setEditingMessageId(null)
    setEditContent('')
  }

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingMessageId(null)
    setEditContent('')
  }

  // Generate code block ID
  const generateCodeId = () => `code-${Math.random().toString(36).substr(2, 9)}`

  // Custom markdown components
  const MarkdownComponents = {
    // Code blocks with syntax highlighting
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '')
      const language = match ? match[1] : 'text'
      const codeId = generateCodeId()
      const codeString = String(children).replace(/\n$/, '')

      if (!inline && match) {
        return (
          <div className="relative group my-4">
            <div className="flex items-center justify-between bg-slate-800 px-4 py-2 rounded-t-lg border-b border-slate-700">
              <span className="text-xs font-medium text-slate-400 capitalize">{language}</span>
              <button
                onClick={() => handleCopyCode(codeString, codeId)}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
              >
                {copiedCode === codeId ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-green-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <SyntaxHighlighter
              style={vscDarkPlus}
              language={language}
              PreTag="div"
              className="!bg-slate-900 !rounded-b-lg !rounded-t-none !m-0 !p-4 text-sm overflow-x-auto"
              {...props}
            >
              {codeString}
            </SyntaxHighlighter>
          </div>
        )
      }

      // Inline code
      return (
        <code className="bg-slate-800 text-cyan-400 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
          {children}
        </code>
      )
    },

    // Headings
    h1: ({ children }: any) => (
      <h1 className="text-xl font-bold text-white mt-6 mb-3">{children}</h1>
    ),
    h2: ({ children }: any) => (
      <h2 className="text-lg font-semibold text-white mt-5 mb-2">{children}</h2>
    ),
    h3: ({ children }: any) => (
      <h3 className="text-base font-medium text-white mt-4 mb-2">{children}</h3>
    ),

    // Paragraphs
    p: ({ children }: any) => (
      <p className="text-slate-300 leading-relaxed mb-4">{children}</p>
    ),

    // Lists
    ul: ({ children }: any) => (
      <ul className="list-disc list-inside text-slate-300 mb-4 space-y-1">{children}</ul>
    ),
    ol: ({ children }: any) => (
      <ol className="list-decimal list-inside text-slate-300 mb-4 space-y-1">{children}</ol>
    ),
    li: ({ children }: any) => (
      <li className="ml-2">{children}</li>
    ),

    // Blockquotes
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-cyan-500/30 pl-4 py-2 my-4 bg-slate-800/30 rounded-r-lg">
        <p className="text-slate-400 italic">{children}</p>
      </blockquote>
    ),

    // Links
    a: ({ href, children }: any) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-cyan-400 hover:text-cyan-300 underline"
      >
        {children}
      </a>
    ),

    // Tables
    table: ({ children }: any) => (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full divide-y divide-slate-700 border border-slate-700 rounded-lg">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }: any) => (
      <thead className="bg-slate-800">{children}</thead>
    ),
    tbody: ({ children }: any) => (
      <tbody className="bg-slate-900/50 divide-y divide-slate-700">{children}</tbody>
    ),
    tr: ({ children }: any) => (
      <tr className="hover:bg-slate-800/50">{children}</tr>
    ),
    th: ({ children }: any) => (
      <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
        {children}
      </th>
    ),
    td: ({ children }: any) => (
      <td className="px-4 py-2 text-sm text-slate-300">{children}</td>
    ),

    // Horizontal rule
    hr: () => (
      <hr className="border-slate-700 my-6" />
    ),
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 touch-auto"
      style={{ height: '100%' }}
    >
      <div className={`mx-auto space-y-6 ${isMobile ? 'max-w-full' : 'max-w-3xl'}`}>
        {/* Empty State */}
        {messages.length === 0 && !isLoading && !isGenerating && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-cyan-500/20 blur-3xl rounded-full"></div>
              <div className="relative w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center border border-cyan-500/30">
                <Sparkles className="h-8 w-8 text-cyan-400" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Welcome to ALEX</h2>
            <p className="text-slate-400 mb-6">Your AutoLearn Intelligence & Execution Agent</p>
            
            {/* Example Prompts */}
            <div className="flex flex-wrap justify-center gap-2 max-w-md">
              <button
                onClick={() => {
                  const textarea = document.querySelector('textarea') as HTMLTextAreaElement
                  if (textarea) {
                    textarea.value = "Check my course progress"
                    textarea.dispatchEvent(new Event('input', { bubbles: true }))
                    textarea.focus()
                  }
                }}
                className="px-4 py-2 bg-slate-800/50 rounded-full text-sm text-slate-300 border border-slate-700 hover:bg-slate-700/50 hover:text-white transition-all"
              >
                <BookOpen className="h-4 w-4 inline mr-2" />
                Check my progress
              </button>
              <button
                onClick={() => {
                  const textarea = document.querySelector('textarea') as HTMLTextAreaElement
                  if (textarea) {
                    textarea.value = "What should I study next?"
                    textarea.dispatchEvent(new Event('input', { bubbles: true }))
                    textarea.focus()
                  }
                }}
                className="px-4 py-2 bg-slate-800/50 rounded-full text-sm text-slate-300 border border-slate-700 hover:bg-slate-700/50 hover:text-white transition-all"
              >
                <Lightbulb className="h-4 w-4 inline mr-2" />
                What should I study next?
              </button>
              <button
                onClick={() => {
                  const textarea = document.querySelector('textarea') as HTMLTextAreaElement
                  if (textarea) {
                    textarea.value = "Tell me about my scholarship"
                    textarea.dispatchEvent(new Event('input', { bubbles: true }))
                    textarea.focus()
                  }
                }}
                className="px-4 py-2 bg-slate-800/50 rounded-full text-sm text-slate-300 border border-slate-700 hover:bg-slate-700/50 hover:text-white transition-all"
              >
                <Award className="h-4 w-4 inline mr-2" />
                My scholarship status
              </button>
              <button
                onClick={() => {
                  const textarea = document.querySelector('textarea') as HTMLTextAreaElement
                  if (textarea) {
                    textarea.value = "Help me build an automation"
                    textarea.dispatchEvent(new Event('input', { bubbles: true }))
                    textarea.focus()
                  }
                }}
                className="px-4 py-2 bg-slate-800/50 rounded-full text-sm text-slate-300 border border-slate-700 hover:bg-slate-700/50 hover:text-white transition-all"
              >
                <Workflow className="h-4 w-4 inline mr-2" />
                Build automation
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center border border-cyan-500/30">
                  <Bot className="h-4 w-4 text-cyan-400" />
                </div>
              </div>
            )}
            
            <div
              className={`max-w-2xl rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-gradient-to-br from-cyan-500 to-blue-500 text-slate-900 shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-800/50 backdrop-blur-sm border border-slate-700 text-white'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {message.role === 'assistant' ? (
                    <div className="prose prose-invert prose-sm max-w-none prose-headings:text-white prose-p:text-slate-300 prose-strong:text-white prose-code:text-cyan-400 prose-pre:bg-slate-900">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={MarkdownComponents}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : editingMessageId === message.id ? (
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full bg-white/20 rounded-lg px-3 py-2 text-slate-900 placeholder-slate-700 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
                      rows={3}
                      autoFocus
                    />
                  ) : (
                    <p className="text-slate-900 leading-relaxed">{message.content}</p>
                  )}
                </div>
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleCopyMessage(message.content, message.id)}
                      className="p-1.5 text-slate-500 hover:text-cyan-400 transition-colors"
                      title="Copy response"
                    >
                      {copiedCode === message.id ? (
                        <Check className="h-4 w-4 text-green-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleFeedback(message.id, 'up')}
                      className={`p-1.5 transition-colors ${feedback[message.id] === 'up' ? 'text-green-400' : 'text-slate-500 hover:text-green-400'}`}
                      title="Helpful"
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleFeedback(message.id, 'down')}
                      className={`p-1.5 transition-colors ${feedback[message.id] === 'down' ? 'text-red-400' : 'text-slate-500 hover:text-red-400'}`}
                      title="Not helpful"
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </button>
                    {onRegenerateResponse && index === messages.length - 1 && message.role === 'assistant' && (
                      <button
                        onClick={() => onRegenerateResponse(message.id)}
                        className="p-1.5 text-slate-500 hover:text-cyan-400 transition-colors"
                        title="Regenerate response"
                      >
                        <Zap className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
                {message.role === 'user' && editingMessageId !== message.id && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleCopyMessage(message.content, message.id)}
                      className="p-1.5 text-slate-700 hover:text-white transition-colors"
                      title="Copy message"
                    >
                      {copiedCode === message.id ? (
                        <Check className="h-4 w-4 text-green-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                    {onEditMessage && (
                      <button
                        onClick={() => handleStartEdit(message.id, message.content)}
                        className="p-1.5 text-slate-700 hover:text-white transition-colors"
                        title="Edit message"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
                {message.role === 'user' && editingMessageId === message.id && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={handleSaveEdit}
                      className="p-1.5 text-slate-700 hover:text-green-400 transition-colors"
                      title="Save"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-1.5 text-slate-700 hover:text-red-400 transition-colors"
                      title="Cancel"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {message.role === 'user' && (
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center border border-slate-600">
                  <User className="h-4 w-4 text-slate-300" />
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Loading State */}
        {(isLoading || isGenerating) && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center border border-cyan-500/30">
                <Bot className="h-4 w-4 text-cyan-400" />
              </div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 text-cyan-400 animate-spin" />
                <span className="text-sm text-slate-400">
                  {isGenerating ? 'Thinking...' : 'Loading...'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {messages.some(m => m.content.startsWith('Error:')) && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-500/20 rounded-xl flex items-center justify-center border border-red-500/30">
                <AlertCircle className="h-4 w-4 text-red-400" />
              </div>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3">
              <p className="text-sm text-red-400">
                Something went wrong. Please try again.
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}
