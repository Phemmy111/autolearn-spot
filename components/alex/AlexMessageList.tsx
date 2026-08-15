'use client'

import { useEffect, useRef } from 'react'
import { Message } from '@/lib/alex/types'
import { Loader2, Bot, User } from 'lucide-react'

interface AlexMessageListProps {
  messages: Message[]
  isLoading: boolean
}

export function AlexMessageList({ messages, isLoading }: AlexMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
              <div className="prose prose-invert prose-sm max-w-none">
                {message.content}
              </div>
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