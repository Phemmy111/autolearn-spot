'use client'

import { useState, useEffect, useRef } from 'react'
import { AlexMessageList } from './AlexMessageList'
import { AlexInputArea } from './AlexInputArea'
import { AlexSidebar } from './AlexSidebar'
import { AlexFileList } from './AlexFileList'
import { Message, Conversation, AlexFile } from '@/lib/alex/types'
import { Menu, X, Bot, Plus, Sparkles, Home } from 'lucide-react'

interface AlexChatProps {
  userId: string
}

export function AlexChat({ userId }: AlexChatProps) {
  const [mode, setMode] = useState<'auto' | 'tutor' | 'developer' | 'automation' | 'research' | 'agent_builder'>('auto')
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(280)
  const [isResizing, setIsResizing] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState<AlexFile[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [userId])

  // Close sidebar on mobile when conversation is selected
  useEffect(() => {
    if (isMobile && currentConversation) {
      setIsSidebarOpen(false)
    }
  }, [isMobile, currentConversation])

  const loadConversations = async () => {
    try {
      const res = await fetch('/api/alex/conversations')
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
    }
  }

  const startNewConversation = async () => {
    try {
      const res = await fetch('/api/alex/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      })
      if (res.ok) {
        const data = await res.json()
        setCurrentConversation(data.conversation)
        setMessages([])
        loadConversations()
      }
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
  }

  const selectConversation = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/alex/conversations/${conversationId}`)
      if (res.ok) {
        const data = await res.json()
        setCurrentConversation(data.conversation)
        // Ensure mode is set from the loaded conversation
        setMode(data.conversation.mode || 'auto')
        
        // Load messages
        const messagesRes = await fetch(`/api/alex/conversations/${conversationId}/messages`)
        if (messagesRes.ok) {
          const messagesData = await messagesRes.json()
          setMessages(messagesData.messages || [])
        }

        // Load files
        const filesRes = await fetch(`/api/alex/files?conversationId=${conversationId}`)
        if (filesRes.ok) {
          const filesData = await filesRes.json()
          setAttachedFiles(filesData.files || [])
        }
      }
    } catch (error) {
      console.error('Failed to load conversation:', error)
    }
  }

  const sendMessage = async (content: string, fileIds?: string[]) => {
    if (!currentConversation) {
      await startNewConversation()
      return
    }

    setIsLoading(true)
    setIsGenerating(true)

    // Create abort controller for this request
    const controller = new AbortController()
    setAbortController(controller)

    // Add user message to UI immediately
    const userMessage: Message = {
      id: crypto.randomUUID(),
      conversation_id: currentConversation.id,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }
    setMessages([...messages, userMessage])

    try {
      const res = await fetch('/api/alex/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: currentConversation.id,
          content,
          mode,
          fileIds,
        }),
        signal: controller.signal,
      })

      if (res.ok) {
        const reader = res.body?.getReader()
        if (reader) {
          const decoder = new TextDecoder()
          let assistantContent = ''
          
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            
            const chunk = decoder.decode(value)
            const lines = chunk.split('\n')
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') continue

                console.log('[AlexChat] Received data:', data)

                try {
                  const parsed = JSON.parse(data)
                  console.log('[AlexChat] Parsed event:', parsed)

                  if (parsed.type === 'delta' && parsed.content) {
                    assistantContent += parsed.content
                    console.log('[AlexChat] Delta content:', parsed.content, 'Total:', assistantContent)
                    
                    // Update the assistant message in real-time
                    setMessages(prev => {
                      const lastMessage = prev[prev.length - 1]
                      if (lastMessage && lastMessage.role === 'assistant') {
                        return [
                          ...prev.slice(0, -1),
                          { ...lastMessage, content: assistantContent }
                        ]
                      } else {
                        return [
                          ...prev,
                          {
                            id: crypto.randomUUID(),
                            conversation_id: currentConversation.id,
                            role: 'assistant',
                            content: assistantContent,
                            created_at: new Date().toISOString(),
                          }
                        ]
                      }
                    })
                  } else if (parsed.type === 'error') {
                    console.error('Stream error:', parsed.error)
                    // Handle error in UI
                    setMessages(prev => [
                      ...prev,
                      {
                        id: crypto.randomUUID(),
                        conversation_id: currentConversation.id,
                        role: 'assistant',
                        content: `Error: ${parsed.error}`,
                        created_at: new Date().toISOString(),
                      }
                    ])
                  }
                } catch (e) {
                  // Ignore parse errors for non-JSON lines
                }
              }
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Generation stopped by user')
      } else {
        console.error('Failed to send message:', error)
      }
    } finally {
      setIsLoading(false)
      setIsGenerating(false)
      setAbortController(null)
    }

    // Reload files after sending message to keep attachment UI in sync
    if (currentConversation) {
      const filesRes = await fetch(`/api/alex/files?conversationId=${currentConversation.id}`)
      if (filesRes.ok) {
        const filesData = await filesRes.json()
        setAttachedFiles(filesData.files || [])
      }
    }
  }

  const stopGeneration = () => {
    if (abortController) {
      abortController.abort()
    }
  }

  const handleEditMessage = async (messageId: string, newContent: string) => {
    // Update the message in local state
    setMessages(prev => prev.map(msg =>
      msg.id === messageId ? { ...msg, content: newContent } : msg
    ))

    // Update in database
    try {
      await fetch(`/api/alex/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent }),
      })
    } catch (error) {
      console.error('Failed to edit message:', error)
    }
  }

  const handleRegenerateResponse = async (messageId: string) => {
    // Find the user message that preceded this assistant message
    const messageIndex = messages.findIndex(m => m.id === messageId)
    if (messageIndex <= 0) return

    const userMessage = messages[messageIndex - 1]
    if (userMessage.role !== 'user') return

    // Remove the assistant message and regenerate
    setMessages(prev => prev.slice(0, messageIndex))
    await sendMessage(userMessage.content)
  }

  const handleRemoveFile = async (fileId: string) => {
    try {
      const res = await fetch(`/api/alex/files/${fileId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setAttachedFiles(prev => prev.filter(f => f.id !== fileId))
      } else {
        const error = await res.json()
        alert(`Failed to remove file: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to remove file:', error)
      alert('Failed to remove file')
    }
  }

  // Handle sidebar resize
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile) return
    setIsResizing(true)
    e.preventDefault()
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      const newWidth = e.clientX
      // Clamp width between 200 and 500
      setSidebarWidth(Math.max(200, Math.min(500, newWidth)))
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  return (
    <div
      ref={containerRef}
      className="flex h-full w-full overflow-hidden bg-slate-950 overflow-y-hidden"
    >
      {/* Mobile Header */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between safe-area-top">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            aria-label="Open conversations"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.location.href = '/'}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              aria-label="Go to homepage"
            >
              <Home className="h-4 w-4" />
            </button>
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-white text-sm">ALEX</span>
          </div>
          <button
            onClick={startNewConversation}
            className="w-10 h-10 flex items-center justify-center bg-cyan-500/10 text-cyan-400 rounded-xl hover:bg-cyan-500/20 transition-colors"
            aria-label="New conversation"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Sidebar */}
      <AlexSidebar
        isOpen={isSidebarOpen}
        conversations={conversations}
        currentConversation={currentConversation}
        onSelectConversation={selectConversation}
        onNewConversation={startNewConversation}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onConversationsChanged={loadConversations}
        isMobile={isMobile}
        width={sidebarWidth}
      />

      {/* Resize Handle (Desktop Only) */}
      {!isMobile && isSidebarOpen && (
        <div
          onMouseDown={handleMouseDown}
          className="w-1 bg-slate-800 hover:bg-cyan-500 cursor-col-resize transition-colors z-20 flex-shrink-0"
          style={{ cursor: isResizing ? 'col-resize' : 'col-resize' }}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Desktop Header - Fixed */}
        {!isMobile && (
          <div className="bg-slate-900/50 backdrop-blur-sm border-b border-slate-800 px-6 py-3 flex-shrink-0">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.location.href = '/'}
                  className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white transition-colors rounded-xl hover:bg-slate-800"
                  aria-label="Go to homepage"
                >
                  <Home className="h-5 w-5" />
                </button>
                <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <span className="font-semibold text-white">ALEX</span>
              </div>
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                {isSidebarOpen ? 'Hide' : 'Show'} conversations
              </button>
            </div>
          </div>
        )}

        {/* Messages - Scrollable */}
        <div className={`flex-1 overflow-y-auto overflow-x-hidden ${isMobile ? 'pt-20' : ''}`}>
          <AlexFileList
            files={attachedFiles}
            onRemoveFile={handleRemoveFile}
            isMobile={isMobile}
          />
          <AlexMessageList
            messages={messages}
            isLoading={isLoading}
            isGenerating={isGenerating}
            isMobile={isMobile}
            onEditMessage={handleEditMessage}
            onRegenerateResponse={handleRegenerateResponse}
          />
        </div>

        {/* Input Area - Fixed at bottom */}
        <div className={`bg-slate-900/50 backdrop-blur-sm border-t border-slate-800 flex-shrink-0 ${isMobile ? 'pb-safe-area-bottom' : ''}`}>
          <AlexInputArea
            onSendMessage={sendMessage}
            onStopGeneration={stopGeneration}
            isLoading={isLoading}
            isGenerating={isGenerating}
            isMobile={isMobile}
            currentMode={mode}
            onModeChange={setMode}
            conversationId={currentConversation?.id}
          />
        </div>
      </div>
    </div>
  )
}
