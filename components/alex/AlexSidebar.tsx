'use client'

import { useState } from 'react'
import { Conversation } from '@/lib/alex/types'
import { Plus, MessageSquare, X, MoreVertical, Trash2, Download } from 'lucide-react'

interface AlexSidebarProps {
  isOpen: boolean
  conversations: Conversation[]
  currentConversation: Conversation | null
  onSelectConversation: (id: string) => void
  onNewConversation: () => void
  onToggleSidebar: () => void
}

export function AlexSidebar({
  isOpen,
  conversations,
  currentConversation,
  onSelectConversation,
  onNewConversation,
  onToggleSidebar,
}: AlexSidebarProps) {
  const [showMenu, setShowMenu] = useState<string | null>(null)

  const handleDeleteConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const res = await fetch(`/api/alex/conversations/${conversationId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        if (currentConversation?.id === conversationId) {
          onNewConversation()
        }
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error)
    }
    setShowMenu(null)
  }

  const handleExportConversation = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const res = await fetch(`/api/alex/conversations/${conversationId}/export?format=markdown`)
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `alex-conversation-${conversationId}.md`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Failed to export conversation:', error)
    }
    setShowMenu(null)
  }

  if (!isOpen) {
    return (
      <button
        onClick={onToggleSidebar}
        className="fixed left-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#1f2229] rounded-r-lg flex items-center justify-center text-[#b9cacb] hover:text-[#00f0ff] transition-colors z-10"
        title="Open sidebar"
      >
        <MessageSquare className="h-5 w-5" />
      </button>
    )
  }

  return (
    <div className="w-72 border-r border-[#1f2229] bg-[#0c0e12]/95 backdrop-blur-xl flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#1f2229] flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Conversations</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onNewConversation}
            className="w-8 h-8 flex items-center justify-center bg-[#00f0ff] rounded-lg text-[#00363a] hover:bg-[#00f0ff]/90 transition-colors"
            title="New conversation"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            onClick={onToggleSidebar}
            className="w-8 h-8 flex items-center justify-center text-[#b9cacb] hover:text-white transition-colors"
            title="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.length === 0 ? (
          <div className="text-center py-8 text-sm text-[#b9cacb]">
            No conversations yet
          </div>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
                currentConversation?.id === conversation.id
                  ? 'bg-[#00f0ff]/10 text-[#00f0ff]'
                  : 'hover:bg-[#1f2229] text-[#b9cacb] hover:text-white'
              }`}
              onClick={() => onSelectConversation(conversation.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{conversation.title || 'New Conversation'}</p>
                  <p className="text-xs opacity-60 mt-1 capitalize">{conversation.mode.replace('_', ' ')}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowMenu(showMenu === conversation.id ? null : conversation.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center text-[#b9cacb] hover:text-white transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>

              {showMenu === conversation.id && (
                <div className="absolute right-2 top-10 bg-[#1f2229] border border-[#1f2229] rounded-lg shadow-xl z-10 py-1 min-w-[120px]">
                  <button
                    onClick={(e) => handleExportConversation(conversation.id, e)}
                    className="w-full px-3 py-2 text-left text-sm text-[#b9cacb] hover:text-white hover:bg-[#1f2229]/80 flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </button>
                  <button
                    onClick={(e) => handleDeleteConversation(conversation.id, e)}
                    className="w-full px-3 py-2 text-left text-sm text-red-400 hover:text-red-300 hover:bg-[#1f2229]/80 flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}