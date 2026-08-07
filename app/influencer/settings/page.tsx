'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Settings, Loader2, CheckCircle2, LogOut } from 'lucide-react'
import { ProfilePictureUpload } from '@/components/profile-picture-upload'

export default function InfluencerSettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profilePicture, setProfilePicture] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [userData, setUserData] = useState<any>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/influencer/dashboard")
      const result = await res.json()
      if (res.ok && result.success) {
        setUserData(result)
      }
    } catch (err) {
      console.error('Failed to fetch user data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!loading) {
      fetchProfilePicture()
    }
  }, [loading])

  const handleProfilePictureUpdate = (newPicture: string) => {
    setProfilePicture(newPicture)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2000)
  }

  const fetchProfilePicture = async () => {
    try {
      const response = await fetch('/api/user/profile-picture')
      const result = await response.json()
      if (response.ok) {
        setProfilePicture(result.profilePicture)
      }
    } catch (error) {
      console.error('Failed to fetch profile picture:', error)
    }
  }

  const handleLogout = () => {
    document.cookie = "growth_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/influencer");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center text-[var(--foreground)]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/influencer/dashboard" className="text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-[var(--primary)]" />
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
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Profile Section */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 mb-6">
          <h2 className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-[var(--primary)] mb-6">
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
              <h3 className="text-xl font-bold mb-2">{userData?.user?.full_name || 'Influencer'}</h3>
              <p className="text-[var(--muted-foreground)] text-sm mb-4">{userData?.user?.email || ''}</p>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono uppercase px-2 py-1 bg-purple-500/10 text-[var(--primary)] rounded">
                  {userData?.user?.platform || 'instagram'}
                </span>
                <span className="text-xs font-mono uppercase px-2 py-1 bg-green-500/10 text-green-400 rounded">
                  ₦{(userData?.user?.commission_rate || 2000).toLocaleString()}/referral
                </span>
              </div>
              <p className="text-xs text-[var(--muted-foreground)]/60">
                Update your profile picture to personalize your influencer dashboard experience.
              </p>
            </div>
          </div>
        </div>

        {/* Account Info Section */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
          <h2 className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-[var(--primary)] mb-6">
            Account Information
          </h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-[var(--border)]">
              <span className="text-[var(--muted-foreground)]">Email</span>
              <span className="text-[var(--foreground)]">{userData?.user?.email || ''}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-[var(--border)]">
              <span className="text-[var(--muted-foreground)]">Partner Type</span>
              <span className="text-[var(--foreground)]">Influencer</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-[var(--border)]">
              <span className="text-[var(--muted-foreground)]">Platform</span>
              <span className="text-[var(--foreground)]">{userData?.user?.platform || 'instagram'}</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-[var(--muted-foreground)]">Commission Rate</span>
              <span className="text-[var(--foreground)]">₦{(userData?.user?.commission_rate || 2000).toLocaleString()}/referral</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end">
          <button 
            onClick={handleLogout}
            className="font-mono text-xs uppercase px-4 py-2 border border-[var(--border)] rounded hover:bg-[var(--surface-hover)] transition-colors flex items-center gap-2 text-[var(--muted-foreground)]"
          >
            <LogOut className="h-3 w-3" /> Logout
          </button>
        </div>
      </div>
    </div>
  )
}
