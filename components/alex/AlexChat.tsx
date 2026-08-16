'use client'

import { useState, useEffect, useRef } from 'react'
import { AlexModeSelector } from './AlexModeSelector'
import { AlexMessageList } from './AlexMessageList'
import { AlexInputArea } from './AlexInputArea'
import { AlexSidebar } from './AlexSidebar'
import { Message, Conversation } from '@/lib/alex/types'
import { Menu, X, Bot, Plus, Sparkles } from 'lucide-react'

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
        setMode(data.conversation.mode)
        
        // Load messages
        const messagesRes = await fetch(`/api/alex/conversations/${conversationId}/messages`)
        if (messagesRes.ok) {
          const messagesData = await messagesRes.json()
          setMessages(messagesData.messages || [])
        }
      }
    } catch (error) {
      console.error('Failed to load conversation:', error)
    }
  }

  const sendMessage = async (content: string) => {
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
                
                try {
                  const parsed = JSON.parse(data)
                  
                  if (parsed.type === 'delta' && parsed.content) {
                    assistantContent += parsed.content
                    
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
      if (error.name === 'AbortError') {
        console.log('Generation stopped by user')
      } else {
        console.error('Failed to send message:', error)
      }
    } finally {
      setIsLoading(false)
      setIsGenerating(false)
      setAbortController(null)
    }
  }

  const stopGeneration = () => {
    if (abortController) {
      abortController.abort()
    }
  }

  return (
    <div 
      ref={containerRef}
      className="flex h-full w-full overflow-hidden bg-slate-950"
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
        isMobile={isMobile}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Header */}
        {!isMobile && (
          <div className="bg-slate-900/50 backdrop-blur-sm border-b border-slate-800 px-6 py-3">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              <div className="flex items-center gap-3">
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

        {/* Mode Selector - Compact */}
        <div className={`bg-slate-900/30 backdrop-blur-sm border-b border-slate-800 ${isMobile ? 'pt-16' : ''}`}>
          <AlexModeSelector currentMode={mode} onModeChange={setMode} isMobile={isMobile} />
        </div>

        {/* Messages */}
        <div className={`flex-1 overflow-hidden ${isMobile ? 'pt-2' : ''}`}>
          <AlexMessageList 
            messages={messages} 
            isLoading={isLoading} 
            isGenerating={isGenerating}
            isMobile={isMobile}
          />
        </div>

        {/* Input Area */}
        <div className={`bg-slate-900/50 backdrop-blur-sm border-t border-slate-800 ${isMobile ? 'pb-safe-area-bottom' : ''}`}>
          <AlexInputArea 
            onSendMessage={sendMessage} 
            onStopGeneration={stopGeneration}
            isLoading={isLoading} 
            isGenerating={isGenerating}
            isMobile={isMobile}
          />
        </div>
      </div>
    </div>
  )
}
