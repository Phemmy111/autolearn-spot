'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, Square } from 'lucide-react'

interface AlexInputAreaProps {
  onSendMessage: (content: string) => void
  onStopGeneration?: () => void
  isLoading: boolean
  isGenerating?: boolean
}

export function AlexInputArea({ 
  onSendMessage, 
  onStopGeneration, 
  isLoading, 
  isGenerating = false 
}: AlexInputAreaProps) {
  const [content, setContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Auto-grow textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const newHeight = Math.min(textarea.scrollHeight, 200) // Max height of 200px
      textarea.style.height = `${newHeight}px`
    }
  }, [content])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isMobile) {
      // Mobile: Enter always creates newline, never sends
      return
    }

    // Desktop: Enter sends, Shift+Enter creates newline
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSend = () => {
    if (content.trim() && !isLoading && !isGenerating) {
      onSendMessage(content.trim())
      setContent('')
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleStop = () => {
    if (onStopGeneration) {
      onStopGeneration()
    }
  }

  const handleAttachment = () => {
    // Placeholder for future attachment functionality
    console.log('Attachment button clicked')
  }

  return (
    <div className="border-t border-[#1f2229] bg-[#0c0e12]/50 px-4 py-4 alex-composer-container">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-end gap-3">
          {/* Attachment Button */}
          <button
            type="button"
            onClick={handleAttachment}
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-[#1f2229] rounded-lg text-[#b9cacb] hover:text-[#00f0ff] transition-colors mb-2"
            title="Attach files (coming soon)"
            disabled={isLoading || isGenerating}
            aria-label="Attach files"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          
          {/* Textarea */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask ALEX anything..."
              disabled={isLoading || isGenerating}
              rows={1}
              className="w-full bg-[#1f2229] border border-[#1f2229] rounded-lg px-4 py-3 text-white placeholder-[#b9cacb] focus:outline-none focus:border-[#00f0ff] disabled:opacity-50 resize-none overflow-y-auto min-h-[44px] max-h-[200px]"
              style={{ height: 'auto' }}
              aria-label="Message input"
              aria-describedby={isMobile ? "mobile-input-hint" : undefined}
            />
            {isMobile && (
              <div id="mobile-input-hint" className="sr-only">
                Press Enter for new line, use Send button to send message
              </div>
            )}
          </div>
          
          {/* Send/Stop Button */}
          {isGenerating ? (
            <button
              type="button"
              onClick={handleStop}
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors mb-2"
              title="Stop generation"
              aria-label="Stop generation"
            >
              <Square className="h-5 w-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={!content.trim() || isLoading}
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-[#00f0ff] rounded-lg text-[#00363a] hover:bg-[#00f0ff]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-2"
              title="Send message"
              aria-label="Send message"
            >
              <Send className="h-5 w-5" />
            </button>
          )}
        </div>
        
        {/* Character count hint (optional, can be removed) */}
        {content.length > 0 && (
          <div className="text-right mt-1">
            <span className="text-xs text-[#b9cacb]">
              {content.length} characters
            </span>
          </div>
        )}
      </div>
    </div>
  )
}