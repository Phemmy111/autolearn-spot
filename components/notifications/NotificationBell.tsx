"use client"

import { useState, useEffect, useRef } from 'react'
import { Bell } from 'lucide-react'
import { NotificationDropdown } from './NotificationDropdown'

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoadingCount, setIsLoadingCount] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch('/api/notifications/count')
      if (res.ok) {
        const data = await res.json()
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (err) {
      console.error('Failed to fetch unread count:', err)
    } finally {
      setIsLoadingCount(false)
    }
  }

  useEffect(() => {
    fetchUnreadCount()
    
    // Poll every 60 seconds
    const interval = setInterval(fetchUnreadCount, 60000)
    return () => clearInterval(interval)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const toggleDropdown = () => {
    setIsOpen(!isOpen)
  }

  const handleNotificationsRead = () => {
    // When notifications are marked as read in the dropdown, update the count immediately
    fetchUnreadCount()
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={toggleDropdown}
        className="relative p-2 text-[#b9cacb] hover:text-white transition-colors rounded-full hover:bg-[#1a1d24]"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        
        {!isLoadingCount && unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#00f0ff] text-[10px] font-bold text-black border-2 border-[#111317]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationDropdown 
          onClose={() => setIsOpen(false)} 
          onNotificationsRead={handleNotificationsRead}
        />
      )}
    </div>
  )
}
