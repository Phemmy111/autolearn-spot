'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, Square, Mic, StopCircle, ChevronDown, Sparkles, Lightbulb, BookOpen, Award, Workflow, Search, Zap, X, FileText, Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface AlexInputAreaProps {
  onSendMessage: (content: string, files?: File[]) => void
  onStopGeneration?: () => void
  isLoading: boolean
  isGenerating?: boolean
  isMobile: boolean
  currentMode?: 'auto' | 'tutor' | 'developer' | 'automation' | 'research' | 'agent_builder'
  onModeChange?: (mode: 'auto' | 'tutor' | 'developer' | 'automation' | 'research' | 'agent_builder') => void
  conversationId?: string
}

interface AttachedFile {
  file: File
  id: string
  status: 'uploading' | 'processing' | 'ready' | 'failed'
  error?: string
}

const modes = [
  { value: 'auto', label: 'Auto', icon: Sparkles },
  { value: 'tutor', label: 'Tutor', icon: Lightbulb },
  { value: 'developer', label: 'Developer', icon: Workflow },
  { value: 'automation', label: 'Automation', icon: Search },
  { value: 'research', label: 'Research', icon: BookOpen },
  { value: 'agent_builder', label: 'Agent Builder', icon: Zap },
]

export function AlexInputArea({
  onSendMessage,
  onStopGeneration,
  isLoading,
  isGenerating = false,
  isMobile,
  currentMode = 'auto',
  onModeChange,
  conversationId
}: AlexInputAreaProps) {
  const [content, setContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isComposing, setIsComposing] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [showModeDropdown, setShowModeDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const [showFileSelector, setShowFileSelector] = useState(false)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowModeDropdown(false)
      }
    }

    if (showModeDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showModeDropdown])

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
      const filesToUpload = attachedFiles.filter(f => f.status === 'ready').map(f => f.file)
      onSendMessage(content.trim(), filesToUpload)
      setContent('')
      setAttachedFiles([])
      
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
    if (!conversationId) {
      alert('Please start a conversation first')
      return
    }
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Add files to attached files list
    const newFiles: AttachedFile[] = files.map(file => ({
      file,
      id: Math.random().toString(36).substring(7),
      status: 'uploading' as const
    }))

    setAttachedFiles(prev => [...prev, ...newFiles])

    // Upload each file
    for (const attachedFile of newFiles) {
      await uploadFile(attachedFile)
    }
  }

  const uploadFile = async (attachedFile: AttachedFile) => {
    try {
      const formData = new FormData()
      formData.append('file', attachedFile.file)
      formData.append('conversationId', conversationId!)

      const response = await fetch('/api/alex/files', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        setAttachedFiles(prev => 
          prev.map(f => 
            f.id === attachedFile.id 
              ? { ...f, status: 'ready' }
              : f
          )
        )
      } else {
        setAttachedFiles(prev => 
          prev.map(f => 
            f.id === attachedFile.id 
              ? { ...f, status: 'failed', error: data.error }
              : f
          )
        )
      }
    } catch (error) {
      setAttachedFiles(prev => 
        prev.map(f => 
          f.id === attachedFile.id 
            ? { ...f, status: 'failed', error: 'Upload failed' }
            : f
        )
      )
    }
  }

  const removeAttachment = (id: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== id))
  }

  const handleVoiceInput = () => {
    // Placeholder for future voice input functionality
    setIsRecording(!isRecording)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    if (ext === 'pdf') return <FileText className="h-4 w-4" />
    if (['doc', 'docx'].includes(ext || '')) return <FileText className="h-4 w-4" />
    if (['txt', 'md', 'js', 'jsx', 'ts', 'tsx', 'json', 'css', 'html', 'py', 'java', 'c', 'cpp', 'cs'].includes(ext || '')) return <FileText className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  return (
    <div className="px-4 py-4">
      <div className="max-w-3xl mx-auto">
        {/* File attachments */}
        {attachedFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachedFiles.map((attachedFile) => (
              <div
                key={attachedFile.id}
                className="flex items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2"
              >
                {getFileIcon(attachedFile.file.name)}
                <span className="text-sm text-slate-300 truncate max-w-[150px]">
                  {attachedFile.file.name}
                </span>
                <span className="text-xs text-slate-500">
                  ({formatFileSize(attachedFile.file.size)})
                </span>
                {attachedFile.status === 'uploading' && (
                  <Loader2 className="h-4 w-4 text-cyan-400 animate-spin" />
                )}
                {attachedFile.status === 'ready' && (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                )}
                {attachedFile.status === 'failed' && (
                  <AlertCircle className="h-4 w-4 text-red-400" />
                )}
                <button
                  type="button"
                  onClick={() => removeAttachment(attachedFile.id)}
                  className="text-slate-400 hover:text-white transition-colors"
                  disabled={attachedFile.status === 'uploading'}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-3 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-2 shadow-lg">
          {/* Mode Selector Button */}
          {onModeChange && (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowModeDropdown(!showModeDropdown)}
                className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50 rounded-xl transition-all"
                title="Select mode"
                disabled={isLoading || isGenerating}
                aria-label="Select mode"
              >
                {(() => {
                  const CurrentIcon = modes.find(m => m.value === currentMode)?.icon || Sparkles
                  return <CurrentIcon className="h-5 w-5" />
                })()}
              </button>

              {/* Mode Dropdown */}
              {showModeDropdown && (
                <div className="absolute bottom-full left-0 mb-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 min-w-[180px] py-1">
                  {modes.map((mode) => {
                    const Icon = mode.icon
                    return (
                      <button
                        key={mode.value}
                        type="button"
                        onClick={() => {
                          onModeChange(mode.value as any)
                          setShowModeDropdown(false)
                        }}
                        className={`w-full px-3 py-2 flex items-center gap-2 text-sm transition-colors ${
                          currentMode === mode.value
                            ? 'bg-cyan-500/20 text-cyan-400'
                            : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{mode.label}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Attachment Button */}
          <div className="relative">
            <button
              type="button"
              onClick={handleAttachment}
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50 rounded-xl transition-all"
              title="Attach files"
              disabled={isLoading || isGenerating || !conversationId}
              aria-label="Attach files"
            >
              <Paperclip className="h-5 w-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.md,.js,.jsx,.ts,.tsx,.json,.css,.html,.py,.java,.c,.cpp,.cs,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
          
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
              disabled={!content.trim() || isLoading || attachedFiles.some(f => f.status !== 'ready')}
              className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
                content.trim() && !isLoading && !attachedFiles.some(f => f.status !== 'ready')
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
