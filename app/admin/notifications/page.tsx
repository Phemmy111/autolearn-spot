"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Bell, Plus, Users, Mail, MessageSquare } from 'lucide-react'

type Category = 'announcement' | 'assignment' | 'assignment_review' | 'quiz' | 'payment' | 'enrollment' | 'certificate' | 'live_class' | 'system'
type Priority = 'normal' | 'important' | 'urgent'
type TargetType = 'all' | 'cohort' | 'student'

interface Notification {
  id: string
  title: string
  message: string
  category: Category
  priority: Priority
  target_type: TargetType
  target_id: string | null
  action_url: string | null
  action_label: string | null
  created_at: string
  created_by: string
  recipient_count: number
  delivery_summary: any
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    category: 'announcement' as Category,
    priority: 'normal' as Priority,
    target_type: 'all' as TargetType,
    target_id: '',
    action_url: '',
    action_label: '',
    send_email: false
  })
  
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/admin/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (res.ok) {
        setShowCreateModal(false)
        setFormData({
          title: '',
          message: '',
          category: 'announcement',
          priority: 'normal',
          target_type: 'all',
          target_id: '',
          action_url: '',
          action_label: '',
          send_email: false
        })
        fetchNotifications()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to create notification')
      }
    } catch (err) {
      console.error(err)
      alert('An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredNotifications = notifications.filter(n => 
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    n.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <main className="min-h-screen bg-[#111317] text-[#e2e8e2]">
      <nav className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-[#3b494b] bg-[#111317]/95 px-4 backdrop-blur sm:px-6">
        <Link className="flex items-center gap-2 font-mono text-sm font-bold uppercase text-white" href="/admin">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-[#00f0ff]">//</span>
          <span className="underline decoration-[#b9cacb] decoration-2 underline-offset-2">Admin</span>
        </Link>
        <div className="font-mono text-xs uppercase text-[#b9cacb]">
          Notifications
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="font-heading text-3xl font-bold uppercase text-white">Notification Center</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 border border-[#00f0ff] bg-[#00f0ff] px-4 py-2 font-mono text-xs uppercase font-bold text-black transition hover:bg-white"
          >
            <Plus className="h-4 w-4" />
            New Notification
          </button>
        </div>

        <div className="mb-6 flex gap-4 items-center">
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md border border-[#3b494b] bg-[#1a1d24] px-4 py-2 font-mono text-sm text-white focus:border-[#00f0ff] focus:outline-none"
          />
        </div>

        <div className="rounded-xl border border-[#3b494b] bg-[#1a1d24] overflow-hidden">
          <table className="w-full text-left font-mono text-sm">
            <thead className="bg-[#0c0e12] text-[#b9cacb]">
              <tr>
                <th className="p-4 font-normal">Notification</th>
                <th className="p-4 font-normal hidden md:table-cell">Target</th>
                <th className="p-4 font-normal hidden sm:table-cell">Recipients</th>
                <th className="p-4 font-normal hidden lg:table-cell">Delivery</th>
                <th className="p-4 font-normal">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3b494b]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#b9cacb]">Loading...</td>
                </tr>
              ) : filteredNotifications.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#b9cacb]">No notifications found.</td>
                </tr>
              ) : (
                filteredNotifications.map((notif) => (
                  <tr key={notif.id} className="hover:bg-[#111317] transition-colors">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-white mb-1 flex items-center gap-2">
                          {notif.title}
                          {notif.priority === 'urgent' && <span className="bg-[#ff6b6b] text-black text-[10px] px-1.5 py-0.5 rounded uppercase">Urgent</span>}
                        </span>
                        <span className="text-xs text-[#b9cacb] truncate max-w-xs">{notif.message}</span>
                        <span className="text-[10px] text-[#00f0ff] uppercase mt-1">{notif.category}</span>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <span className="text-[#e2e8e2] capitalize">{notif.target_type}</span>
                      {notif.target_id && <div className="text-[10px] text-[#8b9c9d] mt-1 truncate max-w-[150px]">{notif.target_id}</div>}
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <div className="flex items-center gap-1 text-[#e2e8e2]">
                        <Users className="h-3 w-3 text-[#b9cacb]" />
                        {notif.recipient_count}
                      </div>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <div className="flex gap-3 text-xs">
                        <div className="flex items-center gap-1 text-[#e2e8e2]" title="In-App Sent">
                          <Bell className="h-3 w-3 text-[#00f0ff]" />
                          {notif.delivery_summary?.in_app_sent || 0}
                        </div>
                        <div className="flex items-center gap-1 text-[#e2e8e2]" title="Emails Sent">
                          <Mail className="h-3 w-3 text-[#a855f7]" />
                          {notif.delivery_summary?.email_sent || 0}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-[#b9cacb]">
                      <div>{new Date(notif.created_at).toLocaleDateString()}</div>
                      <div className="text-[10px] text-[#8b9c9d] mt-1">{notif.created_by}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border border-[#1f2229] bg-[#0c0e12] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-xl font-bold text-white">Create Notification</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[#b9cacb] hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block font-mono text-xs uppercase text-[#b9cacb]">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full border border-[#3b494b] bg-[#1a1d24] px-4 py-2 font-mono text-sm text-white focus:border-[#00f0ff] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block font-mono text-xs uppercase text-[#b9cacb]">Message *</label>
                <textarea
                  required
                  rows={3}
                  value={formData.message}
                  onChange={e => setFormData({...formData, message: e.target.value})}
                  className="w-full border border-[#3b494b] bg-[#1a1d24] px-4 py-2 font-mono text-sm text-white focus:border-[#00f0ff] focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block font-mono text-xs uppercase text-[#b9cacb]">Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value as Category})}
                    className="w-full border border-[#3b494b] bg-[#1a1d24] px-4 py-2 font-mono text-sm text-white focus:border-[#00f0ff] focus:outline-none"
                  >
                    <option value="announcement">Announcement</option>
                    <option value="assignment">Assignment</option>
                    <option value="quiz">Quiz</option>
                    <option value="system">System</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block font-mono text-xs uppercase text-[#b9cacb]">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={e => setFormData({...formData, priority: e.target.value as Priority})}
                    className="w-full border border-[#3b494b] bg-[#1a1d24] px-4 py-2 font-mono text-sm text-white focus:border-[#00f0ff] focus:outline-none"
                  >
                    <option value="normal">Normal</option>
                    <option value="important">Important</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block font-mono text-xs uppercase text-[#b9cacb]">Target</label>
                  <select
                    value={formData.target_type}
                    onChange={e => setFormData({...formData, target_type: e.target.value as TargetType})}
                    className="w-full border border-[#3b494b] bg-[#1a1d24] px-4 py-2 font-mono text-sm text-white focus:border-[#00f0ff] focus:outline-none"
                  >
                    <option value="all">All Active Students</option>
                    <option value="cohort">Specific Cohort</option>
                    <option value="student">Specific Student</option>
                  </select>
                </div>
                {formData.target_type !== 'all' && (
                  <div>
                    <label className="mb-2 block font-mono text-xs uppercase text-[#b9cacb]">Target ID *</label>
                    <input
                      type="text"
                      required
                      placeholder={formData.target_type === 'cohort' ? 'Cohort ID' : 'Student Clerk ID'}
                      value={formData.target_id}
                      onChange={e => setFormData({...formData, target_id: e.target.value})}
                      className="w-full border border-[#3b494b] bg-[#1a1d24] px-4 py-2 font-mono text-sm text-white focus:border-[#00f0ff] focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block font-mono text-xs uppercase text-[#b9cacb]">Action Label</label>
                  <input
                    type="text"
                    placeholder="e.g. View Details"
                    value={formData.action_label}
                    onChange={e => setFormData({...formData, action_label: e.target.value})}
                    className="w-full border border-[#3b494b] bg-[#1a1d24] px-4 py-2 font-mono text-sm text-white focus:border-[#00f0ff] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block font-mono text-xs uppercase text-[#b9cacb]">Action URL</label>
                  <input
                    type="text"
                    placeholder="e.g. /dashboard/quiz"
                    value={formData.action_url}
                    onChange={e => setFormData({...formData, action_url: e.target.value})}
                    className="w-full border border-[#3b494b] bg-[#1a1d24] px-4 py-2 font-mono text-sm text-white focus:border-[#00f0ff] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-[#3b494b]">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 border flex items-center justify-center transition-colors ${formData.send_email ? 'border-[#00f0ff] bg-[#00f0ff]/20 text-[#00f0ff]' : 'border-[#3b494b] bg-[#1a1d24] text-transparent'}`}>
                    <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/></svg>
                  </div>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={formData.send_email}
                    onChange={e => setFormData({...formData, send_email: e.target.checked})}
                  />
                  <div>
                    <span className="font-mono text-xs uppercase text-[#e2e8e2] group-hover:text-white transition-colors">Also Send Email</span>
                    <p className="text-[10px] text-[#8b9c9d] mt-0.5">Sends to users who haven't opted out</p>
                  </div>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#00f0ff] py-3 font-mono text-sm font-bold uppercase text-black transition-colors hover:bg-white disabled:opacity-50 mt-4"
              >
                {submitting ? 'Sending...' : 'Send Notification'}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
