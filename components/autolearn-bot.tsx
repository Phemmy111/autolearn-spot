'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Bot, X, Send, Sparkles, Loader2, MessageCircle, Trash2 } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_CHAT_WEBHOOK_URL || ''

function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  let sid = localStorage.getItem('autolearn-bot-session')
  if (!sid) {
    sid = `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    localStorage.setItem('autolearn-bot-session', sid)
  }
  return sid
}

function getSavedMessages(): Message[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem('autolearn-bot-messages')
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
  } catch {
    return []
  }
}

function saveMessages(messages: Message[]) {
  if (typeof window === 'undefined') return
  // Keep only the last 50 messages to avoid filling localStorage
  const toSave = messages.slice(-50)
  localStorage.setItem('autolearn-bot-messages', JSON.stringify(toSave))
}

function clearSession() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('autolearn-bot-session')
  localStorage.removeItem('autolearn-bot-messages')
}

export function AutolearnBot({ context = 'landing' }: { context?: 'landing' | 'dashboard' }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPulse, setShowPulse] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setIsMounted(true)
    setMessages(getSavedMessages())
    // Stop pulsing after 8 seconds
    const timer = setTimeout(() => setShowPulse(false), 8000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      // Focus input after a short delay so the modal renders first
      setTimeout(() => inputRef.current?.focus(), 150)
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSend = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    }

    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)
    saveMessages(updatedMessages)
    setInput('')
    setIsLoading(true)

    try {
      const sessionId = getSessionId()
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatInput: trimmed,
          sessionId,
          context,
        }),
      })

      if (!res.ok) throw new Error('Network error')

      const data = await res.json()
      // n8n Chat Trigger returns { output: "..." }
      const botReply = data.output || data.reply || data.text || data.message || 'Sorry, I could not process that. Please try again.'

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: botReply,
        timestamp: new Date(),
      }

      const withReply = [...updatedMessages, botMsg]
      setMessages(withReply)
      saveMessages(withReply)
    } catch (err) {
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Oops! I couldn\'t connect to the server right now. Please try again in a moment.',
        timestamp: new Date(),
      }
      const withError = [...updatedMessages, errorMsg]
      setMessages(withError)
      saveMessages(withError)
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, messages, context])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClearChat = () => {
    clearSession()
    setMessages([])
  }

  const quickPrompts = context === 'dashboard'
    ? [
        'Help me debug my n8n workflow',
        'How do I connect Google Sheets?',
        'Explain HTTP Request node',
      ]
    : [
        'What is AutoLearn Spot?',
        'How much does it cost?',
        'What will I learn?',
      ]

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  // Floating trigger button
  const triggerButton = (
    <button
      onClick={() => setIsOpen(true)}
      className="fixed bottom-24 right-6 z-40 group flex items-center gap-2"
      type="button"
      aria-label="Open Autolearn Bot"
    >
      {/* Tooltip */}
      <span className="hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[#1a1d24] border border-[#3b494b] text-[#e2e8e2] text-xs font-mono px-3 py-2 rounded-lg shadow-lg whitespace-nowrap mr-2">
        Ask Autolearn Bot 🤖
      </span>
      <span
        className={`relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#7c3aed] to-[#a855f7] text-white shadow-[0_4px_20px_rgba(124,58,237,0.4)] transition-all duration-300 hover:scale-110 hover:shadow-[0_6px_28px_rgba(124,58,237,0.55)] ${showPulse ? 'animate-bounce' : ''}`}
      >
        <Bot className="h-7 w-7" />
        {/* Online indicator */}
        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-500 border-2 border-[#111317]" />
        </span>
      </span>
    </button>
  )

  // Chat modal
  const chatModal = isOpen && isMounted
    ? createPortal(
        <div
          className="fixed inset-0 z-50 flex items-end justify-end p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="autolearn-bot-title"
        >
          {/* Backdrop */}
          <button
            className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-default"
            onClick={() => setIsOpen(false)}
            type="button"
            aria-label="Close chat"
          />

          {/* Chat window */}
          <div className="relative flex flex-col w-full sm:w-[420px] h-[85vh] sm:h-[600px] max-h-[85vh] rounded-2xl border border-[#3b494b] bg-[#0c0e12] shadow-[0_30px_100px_rgba(124,58,237,0.15)] overflow-hidden">
            {/* Glow accent */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#a855f7] to-transparent" />

            {/* ── Header ── */}
            <div className="flex items-center justify-between border-b border-[#1f2229] bg-[#111317] px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#7c3aed] to-[#a855f7] text-white">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h2 id="autolearn-bot-title" className="text-sm font-semibold text-[#e2e8e2]">
                    Autolearn Bot
                  </h2>
                  <p className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Online
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleClearChat}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-[#5d5f63] transition hover:bg-[#1a1d24] hover:text-[#b9cacb]"
                  type="button"
                  title="Clear conversation"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-[#5d5f63] transition hover:bg-[#1a1d24] hover:text-[#b9cacb]"
                  type="button"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* ── Messages area ── */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">
              {/* Welcome message */}
              {messages.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7c3aed]/20 to-[#a855f7]/20 border border-[#7c3aed]/30 mb-4">
                    <Sparkles className="h-8 w-8 text-[#a855f7]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#e2e8e2] mb-1">
                    {context === 'dashboard' ? 'Your Learning Companion' : 'Welcome to AutoLearn Spot!'}
                  </h3>
                  <p className="text-sm text-[#5d5f63] mb-6 max-w-[280px]">
                    {context === 'dashboard'
                      ? 'Stuck on a workflow? Ask me anything about n8n, automations, or debugging.'
                      : 'I can answer questions about our programme, pricing, and how to get started.'}
                  </p>
                  <div className="w-full space-y-2">
                    {quickPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => {
                          setInput(prompt)
                          // Auto-send after a brief moment
                          setTimeout(() => {
                            const fakeEvent = { key: 'Enter', shiftKey: false, preventDefault: () => {} }
                            // We'll just set and let the user click send, or we trigger handleSend
                          }, 50)
                        }}
                        className="w-full text-left border border-[#1f2229] bg-[#111317] rounded-xl px-4 py-3 text-xs text-[#b9cacb] font-mono transition hover:border-[#7c3aed]/50 hover:bg-[#1a1d24] hover:text-[#e2e8e2]"
                        type="button"
                      >
                        <MessageCircle className="inline h-3.5 w-3.5 mr-2 text-[#7c3aed]" />
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Message bubbles */}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-[#7c3aed] to-[#a855f7] text-white rounded-br-md'
                        : 'bg-[#1a1d24] border border-[#1f2229] text-[#e2e8e2] rounded-bl-md'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    <p className={`text-[10px] mt-1.5 ${msg.role === 'user' ? 'text-white/50' : 'text-[#5d5f63]'}`}>
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#1a1d24] border border-[#1f2229] rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-[#a855f7]" />
                      <span className="text-xs text-[#5d5f63] font-mono">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ── Input area ── */}
            <div className="border-t border-[#1f2229] bg-[#111317] px-3 py-3">
              <div className="flex items-end gap-2 rounded-xl border border-[#1f2229] bg-[#0c0e12] px-3 py-2 focus-within:border-[#7c3aed]/50 transition-colors">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  className="flex-1 resize-none bg-transparent text-sm text-[#e2e8e2] placeholder-[#5d5f63] outline-none max-h-24"
                  rows={1}
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all ${
                    input.trim() && !isLoading
                      ? 'bg-gradient-to-br from-[#7c3aed] to-[#a855f7] text-white hover:opacity-90 shadow-[0_2px_12px_rgba(124,58,237,0.3)]'
                      : 'bg-[#1a1d24] text-[#5d5f63] cursor-not-allowed'
                  }`}
                  type="button"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 text-center text-[10px] font-mono text-[#5d5f63]">
                Powered by AutoLearn Spot AI
              </p>
            </div>
          </div>
        </div>,
        document.body,
      )
    : null

  return isMounted
    ? createPortal(
        <>
          {triggerButton}
          {chatModal}
        </>,
        document.body
      )
    : <>{triggerButton}</>
}
