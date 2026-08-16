'use client'

import { useState, useEffect } from 'react'
import { Conversation } from '@/lib/alex/types'
import { Plus, MessageSquare, X, MoreVertical, Trash2, Download, Search, Clock } from 'lucide-react'

interface AlexSidebarProps {
  isOpen: boolean
  conversations: Conversation[]
  currentConversation: Conversation | null
  onSelectConversation: (id: string) => void
  onNewConversation: () => void
  onToggleSidebar: () => void
  isMobile: boolean
}

export function AlexSidebar({
  isOpen,
  conversations,
  currentConversation,
  onSelectConversation,
  onNewConversation,
  onToggleSidebar,
  isMobile,
}: AlexSidebarProps) {
  const [showMenu, setShowMenu] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isAnimating, setIsAnimating] = useState(false)

  // Handle animation states
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
    } else {
      const timer = setTimeout(() => setIsAnimating(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

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

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv => 
    conv.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.mode.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return date.toLocaleDateString()
  }

  // Mobile drawer
  if (isMobile) {
    return (
      <>
        {/* Overlay */}
        {isOpen && (
          <div
            className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${
              isAnimating ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={onToggleSidebar}
            aria-hidden="true"
          />
        )}
        
        {/* Mobile Sidebar */}
        <div
          className={`fixed left-0 top-0 bottom-0 w-80 bg-slate-900/95 backdrop-blur-xl z-50 flex flex-col transition-transform duration-300 ease-out transform ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between pt-safe-area-top">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-cyan-400" />
              </div>
              <h2 className="text-sm font-semibold text-white">Conversations</h2>
            </div>
            <button
              onClick={onToggleSidebar}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-slate-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* New Conversation Button */}
          <div className="p-4">
            <button
              onClick={() => {
                onNewConversation()
                onToggleSidebar()
              }}
              className="w-full flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-medium rounded-lg px-4 py-3 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Conversation
            </button>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto px-2 space-y-1 pb-4">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-8">
                {searchQuery ? (
                  <p className="text-sm text-slate-500">No conversations found</p>
                ) : (
                  <>
                    <MessageSquare className="h-8 w-8 text-slate-700 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No conversations yet</p>
                    <p className="text-xs text-slate-600 mt-1">Start a new conversation to get started</p>
                  </>
                )}
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`group relative p-3 rounded-xl cursor-pointer transition-all ${
                    currentConversation?.id === conversation.id
                      ? 'bg-cyan-500/10 border border-cyan-500/20'
                      : 'hover:bg-slate-800/50 border border-transparent'
                  }`}
                  onClick={() => {
                    onSelectConversation(conversation.id)
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Select conversation: ${conversation.title || 'New Conversation'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{conversation.title || 'New Conversation'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500 capitalize">
                          {conversation.mode.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-slate-600">•</span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(conversation.updated_at)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowMenu(showMenu === conversation.id ? null : conversation.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center text-slate-500 hover:text-white transition-opacity"
                      aria-label="Conversation options"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>

                  {showMenu === conversation.id && (
                    <div className="absolute right-2 top-10 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 py-1 min-w-[140px]">
                      <button
                        onClick={(e) => handleExportConversation(conversation.id, e)}
                        className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:text-white hover:bg-slate-700 flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Export
                      </button>
                      <button
                        onClick={(e) => handleDeleteConversation(conversation.id, e)}
                        className="w-full px-3 py-2 text-left text-sm text-red-400 hover:text-red-300 hover:bg-slate-700 flex items-center gap-2"
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
      </>
    )
  }

  // Desktop collapsed state
  if (!isOpen) {
    return (
      <button
        onClick={onToggleSidebar}
        className="fixed left-0 top-1/2 -translate-y-1/2 w-12 h-12 bg-slate-800 hover:bg-slate-700 rounded-r-xl flex items-center justify-center text-slate-400 hover:text-cyan-400 transition-all duration-200 z-10 border border-slate-700 border-l-0 shadow-lg"
        title="Open sidebar"
        aria-label="Open sidebar"
      >
        <MessageSquare className="h-5 w-5" />
      </button>
    )
  }

  // Desktop expanded state
  return (
    <div className="w-80 bg-slate-900/50 backdrop-blur-xl border-r border-slate-800 flex flex-col transition-all duration-300">
      {/* Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-cyan-500/10 rounded-lg flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-cyan-400" />
            </div>
            <h2 className="text-sm font-semibold text-white">Conversations</h2>
          </div>
          <button
            onClick={onToggleSidebar}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            title="Close sidebar"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          />
        </div>
      </div>

      {/* New Conversation Button */}
      <div className="p-4">
        <button
          onClick={onNewConversation}
          className="w-full flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-medium rounded-lg px-4 py-3 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Conversation
        </button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1 pb-4">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-8">
            {searchQuery ? (
              <p className="text-sm text-slate-500">No conversations found</p>
            ) : (
              <>
                <MessageSquare className="h-8 w-8 text-slate-700 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No conversations yet</p>
                <p className="text-xs text-slate-600 mt-1">Start a new conversation to get started</p>
              </>
            )}
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`group relative p-3 rounded-xl cursor-pointer transition-all ${
                currentConversation?.id === conversation.id
                  ? 'bg-cyan-500/10 border border-cyan-500/20'
                  : 'hover:bg-slate-800/50 border border-transparent'
              }`}
              onClick={() => onSelectConversation(conversation.id)}
              role="button"
              tabIndex={0}
              aria-label={`Select conversation: ${conversation.title || 'New Conversation'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{conversation.title || 'New Conversation'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500 capitalize">
                      {conversation.mode.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-600">•</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(conversation.updated_at)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowMenu(showMenu === conversation.id ? null : conversation.id)
                  }}
                  className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center text-slate-500 hover:text-white transition-opacity"
                  aria-label="Conversation options"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>

              {showMenu === conversation.id && (
                <div className="absolute right-2 top-10 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 py-1 min-w-[140px]">
                  <button
                    onClick={(e) => handleExportConversation(conversation.id, e)}
                    className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:text-white hover:bg-slate-700 flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </button>
                  <button
                    onClick={(e) => handleDeleteConversation(conversation.id, e)}
                    className="w-full px-3 py-2 text-left text-sm text-red-400 hover:text-red-300 hover:bg-slate-700 flex items-center gap-2"
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
