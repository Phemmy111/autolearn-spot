"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'

export default function NotificationSettingsPage() {
  const [preferences, setPreferences] = useState({
    assignment_updates: true,
    quiz_notifications: true,
    live_class_notifications: true,
    email_notifications: true,
    announcement_notifications: true
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const res = await fetch('/api/notification-preferences')
        if (res.ok) {
          const data = await res.json()
          if (data.preferences) {
            setPreferences(data.preferences)
          }
        }
      } catch (err) {
        console.error('Failed to fetch preferences', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchPreferences()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch('/api/notification-preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      })
      
      if (res.ok) {
        setMessage('Settings saved successfully!')
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage('Failed to save settings.')
      }
    } catch (err) {
      setMessage('An error occurred.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111317] p-8">
        <p className="font-mono text-sm text-[#b9cacb]">Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#111317] text-[#e2e8e2] p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-[#b9cacb] hover:text-white font-mono text-sm mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="font-heading text-3xl font-bold uppercase text-white mb-2">Notification Settings</h1>
          <p className="font-mono text-sm text-[#b9cacb]">
            Choose what updates you want to receive and how you receive them.
          </p>
        </div>

        <div className="space-y-6">
          <div className="border border-[#3b494b] bg-[#1a1d24] p-6 rounded-xl">
            <h2 className="font-heading text-xl font-bold text-white mb-6">Channels</h2>
            
            <div className="flex items-center justify-between py-3 border-b border-[#3b494b]/50">
              <div>
                <p className="font-bold text-white">Email Notifications</p>
                <p className="text-xs text-[#b9cacb] mt-1">Receive important updates via email</p>
              </div>
              <button 
                onClick={() => handleToggle('email_notifications')}
                className={`w-12 h-6 rounded-full transition-colors relative ${preferences.email_notifications ? 'bg-[#00f0ff]' : 'bg-[#3b494b]'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${preferences.email_notifications ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>
            
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-bold text-white">In-App Notifications</p>
                <p className="text-xs text-[#b9cacb] mt-1">Receive updates in the dashboard bell</p>
              </div>
              <button disabled className="w-12 h-6 rounded-full bg-[#00f0ff] opacity-50 relative cursor-not-allowed">
                <div className="absolute top-1 w-4 h-4 rounded-full bg-white left-7"></div>
              </button>
              <span className="sr-only">Always on</span>
            </div>
          </div>

          <div className="border border-[#3b494b] bg-[#1a1d24] p-6 rounded-xl">
            <h2 className="font-heading text-xl font-bold text-white mb-6">Preferences</h2>
            
            <div className="space-y-4">
              <label className="flex items-start gap-4 cursor-pointer group">
                <div className={`w-5 h-5 border mt-0.5 flex items-center justify-center transition-colors ${preferences.announcement_notifications ? 'border-[#00f0ff] bg-[#00f0ff]/20 text-[#00f0ff]' : 'border-[#3b494b] bg-[#111317] text-transparent'}`}>
                  <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/></svg>
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={preferences.announcement_notifications}
                  onChange={() => handleToggle('announcement_notifications')}
                />
                <div>
                  <p className="font-bold text-white group-hover:text-[#00f0ff] transition-colors">Announcements</p>
                  <p className="text-xs text-[#b9cacb] mt-1">Instructor announcements and updates</p>
                </div>
              </label>

              <label className="flex items-start gap-4 cursor-pointer group">
                <div className={`w-5 h-5 border mt-0.5 flex items-center justify-center transition-colors ${preferences.assignment_updates ? 'border-[#00f0ff] bg-[#00f0ff]/20 text-[#00f0ff]' : 'border-[#3b494b] bg-[#111317] text-transparent'}`}>
                  <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/></svg>
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={preferences.assignment_updates}
                  onChange={() => handleToggle('assignment_updates')}
                />
                <div>
                  <p className="font-bold text-white group-hover:text-[#00f0ff] transition-colors">Assignments</p>
                  <p className="text-xs text-[#b9cacb] mt-1">New assignments and grading reviews</p>
                </div>
              </label>

              <label className="flex items-start gap-4 cursor-pointer group">
                <div className={`w-5 h-5 border mt-0.5 flex items-center justify-center transition-colors ${preferences.quiz_notifications ? 'border-[#00f0ff] bg-[#00f0ff]/20 text-[#00f0ff]' : 'border-[#3b494b] bg-[#111317] text-transparent'}`}>
                  <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/></svg>
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={preferences.quiz_notifications}
                  onChange={() => handleToggle('quiz_notifications')}
                />
                <div>
                  <p className="font-bold text-white group-hover:text-[#00f0ff] transition-colors">Quizzes</p>
                  <p className="text-xs text-[#b9cacb] mt-1">New quizzes available and reminders</p>
                </div>
              </label>

              <label className="flex items-start gap-4 cursor-pointer group">
                <div className={`w-5 h-5 border mt-0.5 flex items-center justify-center transition-colors ${preferences.live_class_notifications ? 'border-[#00f0ff] bg-[#00f0ff]/20 text-[#00f0ff]' : 'border-[#3b494b] bg-[#111317] text-transparent'}`}>
                  <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/></svg>
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={preferences.live_class_notifications}
                  onChange={() => handleToggle('live_class_notifications')}
                />
                <div>
                  <p className="font-bold text-white group-hover:text-[#00f0ff] transition-colors">Live Classes</p>
                  <p className="text-xs text-[#b9cacb] mt-1">Upcoming live classes and links</p>
                </div>
              </label>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-[#00f0ff] px-6 py-3 font-mono text-sm font-bold uppercase text-black transition hover:bg-white disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
            {message && (
              <span className={`font-mono text-sm ${message.includes('success') ? 'text-[#00f0ff]' : 'text-[#ff6b6b]'}`}>
                {message}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
