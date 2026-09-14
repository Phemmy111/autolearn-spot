'use client'

import { useState, useEffect } from 'react'
import { useAuth, useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { ArrowLeft, Settings, Loader2, CheckCircle2 } from 'lucide-react'
import { ProfilePictureUpload } from '@/components/profile-picture-upload'

export default function SettingsPage() {
  const { isSignedIn, isLoaded } = useAuth()
  const { user } = useUser()
  const [loading, setLoading] = useState(true)
  const [profilePicture, setProfilePicture] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchProfilePicture()
    }
  }, [isLoaded, isSignedIn])

  const fetchProfilePicture = async () => {
    try {
      const response = await fetch('/api/user/profile-picture')
      const result = await response.json()
      if (response.ok) {
        setProfilePicture(result.profilePicture)
      }
    } catch (error) {
      console.error('Failed to fetch profile picture:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProfilePictureUpdate = (newPicture: string) => {
    setProfilePicture(newPicture)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2000)
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center text-brand-text">
        <Loader2 className="h-8 w-8 animate-spin text-[#10b981]" />
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center text-brand-text">
        <p className="text-brand-text/60">Please sign in to access settings</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-brand-bg text-brand-text">
      {/* Header */}
      <div className="border-b border-brand-border bg-brand-bg/95 backdrop-blur sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-brand-text/60 hover:text-[#10b981] transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-[#10b981]" />
              <h1 className="font-mono text-sm font-bold uppercase tracking-[0.18em]">Settings</h1>
            </div>
          </div>
          {saveSuccess && (
            <div className="flex items-center gap-2 text-[#10b981] text-sm font-medium animate-in fade-in">
              <CheckCircle2 className="h-4 w-4" />
              <span>Saved</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── PROFILE ── */}
        <div className="bg-[var(--card)] border border-brand-border rounded-2xl p-6 shadow-sm">
          <h2 className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#10b981] mb-6">Profile</h2>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
            <ProfilePictureUpload
              currentPicture={profilePicture}
              onUploadComplete={handleProfilePictureUpdate}
              size="lg"
              showLabel={false}
            />
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-1 text-brand-text">{user?.firstName || 'Student'}</h3>
              <p className="text-brand-text/60 text-sm mb-3">{user?.emailAddresses?.[0]?.emailAddress || ''}</p>
              <p className="text-xs text-brand-text/40">
                Upload a photo to personalise your dashboard experience.
              </p>
            </div>
          </div>
        </div>

        {/* ── ACCOUNT INFO ── */}
        <div className="bg-[var(--card)] border border-brand-border rounded-2xl p-6 shadow-sm">
          <h2 className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#10b981] mb-6">Account Information</h2>
          <div className="space-y-0">
            {[
              { label: 'Email',    value: user?.emailAddresses?.[0]?.emailAddress || '—' },
              { label: 'Name',     value: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || '—' },
              { label: 'Username', value: user?.username || 'Not set' },
            ].map((row, idx, arr) => (
              <div
                key={row.label}
                className={`flex justify-between items-center py-3.5 ${idx < arr.length - 1 ? 'border-b border-brand-border' : ''}`}
              >
                <span className="text-sm text-brand-text/60 font-medium">{row.label}</span>
                <span className="text-sm text-brand-text font-medium max-w-[60%] truncate text-right">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  )
}
