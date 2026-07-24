"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { X, CheckCircle2, AlertCircle, Info, Megaphone, Check, Settings } from 'lucide-react'

// Types
type Category = 'announcement' | 'assignment' | 'assignment_review' | 'quiz' | 'payment' | 'enrollment' | 'certificate' | 'live_class' | 'system'
type Priority = 'normal' | 'important' | 'urgent'

interface Notification {
  id: string;
  title: string;
  message: string;
  category: Category;
  priority: Priority;
  is_pinned: boolean;
  action_url: string | null;
  action_label: string | null;
  media_url: string | null;
  created_at: string;
}

interface Delivery {
  id: string;
  notification_id: string;
  status: 'unread' | 'read' | 'delivered' | 'failed';
  notification: Notification;
}

interface NotificationDropdownProps {
  onClose: () => void;
  onNotificationsRead: () => void;
}

export function NotificationDropdown({ onClose, onNotificationsRead }: NotificationDropdownProps) {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/notifications')
      if (!res.ok) throw new Error('Failed to fetch notifications')
      const data = await res.json()
      setDeliveries(data.notifications || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const markAsRead = async (notificationId: string) => {
    try {
      // Optimistic update
      setDeliveries(prev => prev.map(d => 
        d.notification_id === notificationId ? { ...d, status: 'read' } : d
      ))
      
      const res = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: [notificationId] })
      })
      
      if (res.ok) {
        onNotificationsRead()
      }
    } catch (err) {
      console.error('Failed to mark read', err)
      // Revert on error
      fetchNotifications()
    }
  }

  const markAllAsRead = async () => {
    const unreadIds = deliveries.filter(d => d.status === 'unread').map(d => d.notification_id)
    if (unreadIds.length === 0) return

    try {
      setDeliveries(prev => prev.map(d => ({ ...d, status: 'read' })))
      
      const res = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true })
      })
      
      if (res.ok) {
        onNotificationsRead()
      }
    } catch (err) {
      console.error('Failed to mark all read', err)
      fetchNotifications()
    }
  }

  const getCategoryIcon = (category: Category, priority: Priority) => {
    if (priority === 'urgent') return <AlertCircle className="h-5 w-5 text-[#ff6b6b]" />
    
    switch (category) {
      case 'announcement': return <Megaphone className="h-5 w-5 text-[#00f0ff]" />
      case 'assignment_review':
      case 'certificate': return <CheckCircle2 className="h-5 w-5 text-[#a855f7]" />
      default: return <Info className="h-5 w-5 text-[#b9cacb]" />
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (seconds < 60) return 'Just now'
    
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    
    return date.toLocaleDateString()
  }

  const hasUnread = deliveries.some(d => d.status === 'unread')

  return (
    <div className="absolute right-0 top-12 mt-2 w-80 sm:w-96 rounded-xl border border-[#3b494b] bg-[#111317] shadow-2xl z-50 overflow-hidden flex flex-col max-h-[85vh]">
      <div className="flex items-center justify-between border-b border-[#3b494b] bg-[#1a1d24] p-4">
        <h3 className="font-heading text-lg font-bold text-white">Notifications</h3>
        <div className="flex items-center gap-2">
          {hasUnread && (
            <button 
              onClick={markAllAsRead}
              className="text-xs font-mono text-[#00f0ff] hover:text-white transition-colors flex items-center gap-1"
            >
              <Check className="h-3 w-3" /> Mark all read
            </button>
          )}
          <button onClick={onClose} className="text-[#b9cacb] hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-sm font-mono text-[#b9cacb]">Loading...</div>
        ) : error ? (
          <div className="p-8 text-center text-sm font-mono text-[#ff6b6b]">{error}</div>
        ) : deliveries.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="h-12 w-12 text-[#3b494b] mx-auto mb-3 opacity-50" />
            <p className="text-sm font-mono text-[#b9cacb]">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-[#1f2229]">
            {deliveries.map(delivery => {
              const { notification } = delivery
              const isUnread = delivery.status === 'unread'
              
              return (
                <div 
                  key={delivery.id} 
                  className={`p-4 transition-colors hover:bg-[#1a1d24] ${isUnread ? 'bg-[#111317]' : 'bg-[#0a0c10]'}`}
                  onClick={() => {
                    if (isUnread) markAsRead(notification.id)
                  }}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getCategoryIcon(notification.category, notification.priority)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className={`text-sm font-bold truncate ${isUnread ? 'text-white' : 'text-[#b9cacb]'}`}>
                          {notification.title}
                        </p>
                        <span className="flex-shrink-0 text-[10px] font-mono text-[#b9cacb]">
                          {formatTimeAgo(notification.created_at)}
                        </span>
                      </div>
                      <p className={`text-xs mb-2 ${isUnread ? 'text-[#e2e8e2]' : 'text-[#8b9c9d]'}`}>
                        {notification.message}
                      </p>
                      
                      {notification.action_url && (
                        <div className="mt-2">
                          <Link 
                            href={notification.action_url}
                            className="inline-block px-3 py-1 bg-[#0c0e12] border border-[#3b494b] text-[#00f0ff] hover:bg-[#00f0ff] hover:text-black font-mono text-xs rounded transition-colors"
                            onClick={(e) => {
                              if (isUnread) markAsRead(notification.id)
                            }}
                          >
                            {notification.action_label || 'View'}
                          </Link>
                        </div>
                      )}
                    </div>
                    {isUnread && (
                      <div className="flex-shrink-0 mt-1.5 h-2 w-2 rounded-full bg-[#00f0ff]"></div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="border-t border-[#3b494b] bg-[#1a1d24] p-3">
        <Link 
          href="/dashboard/settings/notifications" 
          onClick={onClose}
          className="flex items-center justify-center gap-2 text-xs font-mono text-[#b9cacb] hover:text-white transition-colors"
        >
          <Settings className="h-4 w-4" /> Notification Settings
        </Link>
      </div>
    </div>
  )
}
