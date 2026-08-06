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
      <div className="min-h-screen bg-[#111317] flex items-center justify-center text-[#e2e8e2]">
        <Loader2 className="h-8 w-8 animate-spin text-[#00f0ff]" />
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-[#111317] flex items-center justify-center text-[#e2e8e2]">
        <p className="text-[#b9cacb]">Please sign in to access settings</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#111317] text-[#e2e8e2]">
      {/* Header */}
      <div className="border-b border-[#3b494b] bg-[#111317]/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-[#b9cacb] hover:text-[#00f0ff] transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-[#00f0ff]" />
              <h1 className="font-mono text-sm font-bold uppercase tracking-[0.18em]">Settings</h1>
            </div>
          </div>
          {saveSuccess && (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle2 className="h-4 w-4" />
              <span>Saved</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Profile Section */}
        <div className="bg-[#1a1d24] border border-[#3b494b] rounded-2xl p-6 mb-6">
          <h2 className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#00f0ff] mb-6">
            Profile
          </h2>
          
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
            <ProfilePictureUpload 
              currentPicture={profilePicture}
              onUploadComplete={handleProfilePictureUpdate}
              size="lg"
              showLabel={false}
            />
            
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">{user?.firstName || 'Student'}</h3>
              <p className="text-[#b9cacb] text-sm mb-4">{user?.emailAddresses?.[0]?.emailAddress || ''}</p>
              <p className="text-xs text-[#b9cacb]/60">
                Update your profile picture to personalize your dashboard experience.
              </p>
            </div>
          </div>
        </div>

        {/* Account Info Section */}
        <div className="bg-[#1a1d24] border border-[#3b494b] rounded-2xl p-6">
          <h2 className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#00f0ff] mb-6">
            Account Information
          </h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-[#3b494b]">
              <span className="text-[#b9cacb]">Email</span>
              <span className="text-[#e2e8e2]">{user?.emailAddresses?.[0]?.emailAddress || ''}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-[#3b494b]">
              <span className="text-[#b9cacb]">Name</span>
              <span className="text-[#e2e8e2]">{user?.firstName || 'Student'} {user?.lastName || ''}</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-[#b9cacb]">Username</span>
              <span className="text-[#e2e8e2]">{user?.username || 'Not set'}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
