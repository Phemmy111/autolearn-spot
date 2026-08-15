'use client'

import { useState } from 'react'
import { Send, Paperclip } from 'lucide-react'

interface AlexInputAreaProps {
  onSendMessage: (content: string) => void
  isLoading: boolean
}

export function AlexInputArea({ onSendMessage, isLoading }: AlexInputAreaProps) {
  const [content, setContent] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (content.trim() && !isLoading) {
      onSendMessage(content.trim())
      setContent('')
    }
  }

  return (
    <div className="border-t border-[#1f2229] bg-[#0c0e12]/50 px-6 py-4">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <button
            type="button"
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-[#1f2229] rounded-lg text-[#b9cacb] hover:text-[#00f0ff] transition-colors"
            title="Attach files (coming soon)"
            disabled
          >
            <Paperclip className="h-5 w-5" />
          </button>
          
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Ask ALEX anything..."
            disabled={isLoading}
            className="flex-1 bg-[#1f2229] border border-[#1f2229] rounded-lg px-4 py-2 text-white placeholder-[#b9cacb] focus:outline-none focus:border-[#00f0ff] disabled:opacity-50"
          />
          
          <button
            type="submit"
            disabled={!content.trim() || isLoading}
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-[#00f0ff] rounded-lg text-[#00363a] hover:bg-[#00f0ff]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  )
}