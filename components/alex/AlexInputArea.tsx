'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, Square, Mic, StopCircle } from 'lucide-react'

interface AlexInputAreaProps {
  onSendMessage: (content: string) => void
  onStopGeneration?: () => void
  isLoading: boolean
  isGenerating?: boolean
  isMobile: boolean
}

export function AlexInputArea({ 
  onSendMessage, 
  onStopGeneration, 
  isLoading, 
  isGenerating = false,
  isMobile 
}: AlexInputAreaProps) {
  const [content, setContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isComposing, setIsComposing] = useState(false)
  const [isRecording, setIsRecording] = useState(false)

  // Auto-grow textarea with mobile keyboard handling
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      const resetHeight = () => {
        textarea.style.height = 'auto'
        const newHeight = Math.min(textarea.scrollHeight, isMobile ? 120 : 200)
        textarea.style.height = `${newHeight}px`
      }
      
      resetHeight()
      
      // Handle mobile keyboard
      if (isMobile) {
        const handleKeyboardShow = () => {
          setTimeout(resetHeight, 100)
        }
        
        const handleKeyboardHide = () => {
          setTimeout(resetHeight, 100)
        }
        
        window.addEventListener('resize', handleKeyboardShow)
        window.addEventListener('focusin', handleKeyboardShow)
        window.addEventListener('focusout', handleKeyboardHide)
        
        return () => {
          window.removeEventListener('resize', handleKeyboardShow)
          window.removeEventListener('focusin', handleKeyboardShow)
          window.removeEventListener('focusout', handleKeyboardHide)
        }
      }
    }
  }, [content, isMobile])

  // Focus textarea on desktop when not generating
  useEffect(() => {
    if (!isMobile && !isGenerating && !isLoading) {
      textareaRef.current?.focus()
    }
  }, [isMobile, isGenerating, isLoading])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isComposing) return // Don't handle keys while composing (IME input)

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

  const handleVoiceInput = () => {
    // Placeholder for future voice input functionality
    setIsRecording(!isRecording)
  }

  return (
    <div className="px-4 py-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-end gap-3 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-2 shadow-lg">
          {/* Attachment Button */}
          <button
            type="button"
            onClick={handleAttachment}
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50 rounded-xl transition-all"
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
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              placeholder={isMobile ? "Message ALEX..." : "Ask ALEX anything..."}
              disabled={isLoading || isGenerating}
              rows={1}
              className={`w-full bg-transparent border-none text-white placeholder-slate-500 focus:outline-none focus:ring-0 resize-none overflow-y-auto ${
                isMobile ? 'min-h-[52px] max-h-[120px] py-3 px-3 text-base' : 'min-h-[44px] max-h-[200px] py-2 px-3 text-sm'
              }`}
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
          
          {/* Voice Input Button (Mobile Only) */}
          {isMobile && (
            <button
              type="button"
              onClick={handleVoiceInput}
              className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
                isRecording 
                  ? 'bg-red-500/20 text-red-400 animate-pulse' 
                  : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50'
              }`}
              title="Voice input (coming soon)"
              disabled={isLoading || isGenerating}
              aria-label="Voice input"
            >
              {isRecording ? <StopCircle className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
          )}
          
          {/* Send/Stop Button */}
          {isGenerating ? (
            <button
              type="button"
              onClick={handleStop}
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 hover:bg-red-500/30 transition-all"
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
              className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
                content.trim() && !isLoading
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
              title="Send message"
              aria-label="Send message"
            >
              <Send className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
