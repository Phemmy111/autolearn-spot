'use client'

import { useState, useEffect } from 'react'
import { Conversation } from '@/lib/alex/types'
import { Plus, MessageSquare, X, MoreVertical, Trash2, Download, Search, Clock, Check } from 'lucide-react'

interface AlexSidebarProps {
  isOpen: boolean
  conversations: Conversation[]
  currentConversation: Conversation | null
  onSelectConversation: (id: string) => void
  onNewConversation: () => void
  onToggleSidebar: () => void
  onConversationsChanged: () => void
  isMobile: boolean
  width?: number
}

export function AlexSidebar({
  isOpen,
  conversations,
  currentConversation,
  onSelectConversation,
  onNewConversation,
  onToggleSidebar,
  onConversationsChanged,
  isMobile,
  width = 280,
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
        // Refresh conversations list
        onConversationsChanged()
        // If deleted conversation was active, clear it
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
            className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 overflow-hidden touch-none ${
              isAnimating ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={onToggleSidebar}
            aria-hidden="true"
          />
        )}
        
        {/* Mobile Sidebar */}
        <div
          className={`fixed left-0 top-0 bottom-0 w-80 bg-[#2d2d2d] z-50 flex flex-col transition-transform duration-300 ease-out transform overflow-hidden ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          {/* Header */}
          <div className="p-4 border-b border-[#404040] flex items-center justify-between pt-safe-area-top">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-[#10b981] to-[#059669] rounded-lg flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-sm font-semibold text-white">Conversations</h2>
            </div>
            <button
              onClick={onToggleSidebar}
              className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white transition-colors"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-[#404040]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#404040]/50 border border-[#505050] rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981]"
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
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white font-medium rounded-xl px-4 py-3 transition-all shadow-lg shadow-[#10b981]/20"
            >
              <Plus className="h-4 w-4" />
              New Chat
            </button>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 space-y-1 pb-4 touch-auto">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-8">
                {searchQuery ? (
                  <p className="text-sm text-brand-text/60">No conversations found</p>
                ) : (
                  <>
                    <MessageSquare className="h-8 w-8 text-slate-700 mx-auto mb-2" />
                    <p className="text-sm text-brand-text/60">No conversations yet</p>
                    <p className="text-xs text-brand-text/70 mt-1">Start a new conversation</p>
                  </>
                )}
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`group relative p-3 rounded-xl cursor-pointer transition-all ${
                    currentConversation?.id === conversation.id
                      ? 'bg-[#10b981]/10 border border-[#10b981]/20'
                      : 'hover:bg-[#404040]/50 border border-transparent'
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
                        <span className="text-xs text-white/60 capitalize">
                          {conversation.mode.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-white/70">•</span>
                        <span className="text-xs text-white/60 flex items-center gap-1">
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
                      className={`${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} w-6 h-6 flex items-center justify-center text-white/60 hover:text-white transition-opacity`}
                      aria-label="Conversation options"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>

                  {showMenu === conversation.id && (
                    <div className="absolute right-2 top-10 bg-[#404040] border border-[#505050] rounded-lg shadow-xl z-10 py-1 min-w-[140px]">
                      <button
                        onClick={(e) => handleExportConversation(conversation.id, e)}
                        className="w-full px-3 py-2 text-left text-sm text-white/80 hover:text-white hover:bg-[#505050] flex items-center gap-2"
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
        className="fixed left-0 top-1/2 -translate-y-1/2 w-12 h-12 bg-[#2d2d2d] hover:bg-[#404040] rounded-r-xl flex items-center justify-center text-white/60 hover:text-[#10b981] transition-all duration-200 z-10 border border-[#404040] border-l-0 shadow-lg"
        title="Open sidebar"
        aria-label="Open sidebar"
      >
        <MessageSquare className="h-5 w-5" />
      </button>
    )
  }

  // Desktop expanded state
  return (
    <div
      className="bg-[#2d2d2d]/50 backdrop-blur-sm border-r border-[#404040] flex flex-col transition-all duration-300 overflow-hidden"
      style={{ width: `${width}px` }}
    >
      {/* Header */}
      <div className="p-4 border-b border-[#404040]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#10b981] to-[#059669] rounded-lg flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-sm font-semibold text-white">Conversations</h2>
          </div>
          <button
            onClick={onToggleSidebar}
            className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            title="Close sidebar"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#404040]/50 border border-[#505050] rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981]"
          />
        </div>
      </div>

      {/* New Conversation Button */}
      <div className="p-4">
        <button
          onClick={onNewConversation}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white font-medium rounded-xl px-4 py-3 transition-all shadow-lg shadow-[#10b981]/20"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 space-y-1 pb-4">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-8">
            {searchQuery ? (
              <p className="text-sm text-white/60">No conversations found</p>
            ) : (
              <>
                <MessageSquare className="h-8 w-8 text-white/30 mx-auto mb-2" />
                <p className="text-sm text-white/60">No conversations yet</p>
                <p className="text-xs text-white/70 mt-1">Start a new conversation</p>
              </>
            )}
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`group relative p-3 rounded-xl cursor-pointer transition-all ${
                currentConversation?.id === conversation.id
                  ? 'bg-[#10b981]/10 border border-[#10b981]/20'
                  : 'hover:bg-[#404040]/50 border border-transparent'
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
                    <span className="text-xs text-white/60 capitalize">
                      {conversation.mode.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-white/70">•</span>
                    <span className="text-xs text-white/60 flex items-center gap-1">
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
                  className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center text-white/60 hover:text-white transition-opacity"
                  aria-label="Conversation options"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>

              {showMenu === conversation.id && (
                <div className="absolute right-2 top-10 bg-[#404040] border border-[#505050] rounded-lg shadow-xl z-10 py-1 min-w-[140px]">
                  <button
                    onClick={(e) => handleExportConversation(conversation.id, e)}
                    className="w-full px-3 py-2 text-left text-sm text-white/80 hover:text-white hover:bg-[#505050] flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </button>
                  <button
                    onClick={(e) => handleDeleteConversation(conversation.id, e)}
                    className="w-full px-3 py-2 text-left text-sm text-red-400 hover:text-red-300 hover:bg-[#505050] flex items-center gap-2"
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
