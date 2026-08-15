'use client'

import { useState, useEffect } from 'react'
import { AlexModeSelector } from './AlexModeSelector'
import { AlexMessageList } from './AlexMessageList'
import { AlexInputArea } from './AlexInputArea'
import { AlexSidebar } from './AlexSidebar'
import { Message, Conversation } from '@/lib/alex/types'

interface AlexChatProps {
  userId: string
}

export function AlexChat({ userId }: AlexChatProps) {
  const [mode, setMode] = useState<'auto' | 'tutor' | 'developer' | 'automation' | 'research' | 'agent_builder'>('auto')
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [userId])

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
                  if (parsed.content) {
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
      console.error('Failed to send message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-73px)]">
      {/* Sidebar */}
      <AlexSidebar
        isOpen={isSidebarOpen}
        conversations={conversations}
        currentConversation={currentConversation}
        onSelectConversation={selectConversation}
        onNewConversation={startNewConversation}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Mode Selector */}
        <AlexModeSelector currentMode={mode} onModeChange={setMode} />

        {/* Messages */}
        <AlexMessageList messages={messages} isLoading={isLoading} />

        {/* Input Area */}
        <AlexInputArea onSendMessage={sendMessage} isLoading={isLoading} />
      </div>
    </div>
  )
}