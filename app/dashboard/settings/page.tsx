'use client'

import { useState, useEffect } from 'react'
import { useAuth, useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { ArrowLeft, Settings, Loader2, CheckCircle2, Monitor, Sun, Moon, Palette } from 'lucide-react'
import { ProfilePictureUpload } from '@/components/profile-picture-upload'
import { useTheme } from 'next-themes'

// ---------- Appearance presets ----------
const LIGHT_PRESETS = [
  { name: 'Default Light',  bg: '#f8f9fa', fg: '#1a1a2e', accent: '#10b981' },
  { name: 'Snow White',     bg: '#ffffff', fg: '#111827', accent: '#6366f1' },
  { name: 'Warm Paper',     bg: '#fef9f0', fg: '#2d1b00', accent: '#f59e0b' },
  { name: 'Soft Sky',       bg: '#f0f9ff', fg: '#0c4a6e', accent: '#0ea5e9' },
]

const DARK_PRESETS = [
  { name: 'Void (Default)', bg: '#000000', fg: '#ffffff',  accent: '#10b981' },
  { name: 'Obsidian',       bg: '#0a0a0a', fg: '#f2f2f2',  accent: '#a78bfa' },
  { name: 'Deep Slate',     bg: '#0d1117', fg: '#e6edf3',  accent: '#38bdf8' },
  { name: 'Forest Ink',     bg: '#060e0a', fg: '#d4edda',  accent: '#22c55e' },
]

function ColorSwatch({ hex }: { hex: string }) {
  return (
    <span
      className="inline-block w-4 h-4 rounded-full border border-brand-border flex-shrink-0"
      style={{ backgroundColor: hex }}
    />
  )
}

function ThemeButton({
  value, label, icon: Icon, current, onClick
}: { value: string; label: string; icon: any; current: string | undefined; onClick: () => void }) {
  const isActive = current === value
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border text-xs font-semibold transition-all ${
        isActive
          ? 'bg-[#10b981] border-[#10b981] text-white shadow-md'
          : 'border-brand-border text-brand-text/70 hover:border-[#10b981]/50 hover:text-brand-text bg-[var(--card)]'
      }`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  )
}

export default function SettingsPage() {
  const { isSignedIn, isLoaded } = useAuth()
  const { user } = useUser()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [profilePicture, setProfilePicture] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Selected preset indices
  const [lightPreset, setLightPreset] = useState(0)
  const [darkPreset, setDarkPreset] = useState(0)

  useEffect(() => {
    setMounted(true)
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

  /** Apply a preset by writing CSS variables onto :root */
  const applyPreset = (preset: { bg: string; fg: string; accent: string }) => {
    const root = document.documentElement
    root.style.setProperty('--bg-color', preset.bg)
    root.style.setProperty('--text-color', preset.fg)
    root.style.setProperty('--brand-primary', preset.accent)
    root.style.setProperty('--brand-primary-hover', preset.accent)
    // also store in localStorage so it survives refresh
    localStorage.setItem('agy-theme-preset', JSON.stringify(preset))
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

  const isDark = mounted && (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches))

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

        {/* ── APPEARANCE ── */}
        <div className="bg-[var(--card)] border border-brand-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Palette className="h-4 w-4 text-[#10b981]" />
            <h2 className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#10b981]">Appearance</h2>
          </div>

          {/* Theme switcher */}
          <div className="mb-8">
            <p className="text-sm font-semibold text-brand-text mb-3">Theme</p>
            <div className="flex gap-3">
              {mounted ? (
                <>
                  <ThemeButton value="system"  label="System"  icon={Monitor} current={theme} onClick={() => setTheme('system')} />
                  <ThemeButton value="light"   label="Light"   icon={Sun}     current={theme} onClick={() => setTheme('light')} />
                  <ThemeButton value="dark"    label="Dark"    icon={Moon}    current={theme} onClick={() => setTheme('dark')} />
                </>
              ) : (
                <div className="h-14 w-48 rounded-xl bg-brand-border/20 animate-pulse" />
              )}
            </div>
            <p className="text-xs text-brand-text/40 mt-2">
              Dark mode is optimised for late-night study sessions 🌙
            </p>
          </div>

          {/* Light presets */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-brand-text mb-1">Light Theme Preset</p>
            <p className="text-xs text-brand-text/40 mb-3">Applies custom colours for light mode</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {LIGHT_PRESETS.map((p, i) => (
                <button
                  key={p.name}
                  onClick={() => { setLightPreset(i); applyPreset(p) }}
                  className={`flex flex-col gap-2 p-3 rounded-xl border text-left transition-all ${
                    lightPreset === i
                      ? 'border-[#10b981] ring-2 ring-[#10b981]/30'
                      : 'border-brand-border hover:border-[#10b981]/50'
                  }`}
                  style={{ background: p.bg }}
                >
                  <div className="flex gap-1.5">
                    <ColorSwatch hex={p.bg} />
                    <ColorSwatch hex={p.fg} />
                    <ColorSwatch hex={p.accent} />
                  </div>
                  <span className="text-[11px] font-medium leading-tight" style={{ color: p.fg }}>
                    {p.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Dark presets */}
          <div>
            <p className="text-sm font-semibold text-brand-text mb-1">Dark Theme Preset</p>
            <p className="text-xs text-brand-text/40 mb-3">Applies custom colours for dark mode</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {DARK_PRESETS.map((p, i) => (
                <button
                  key={p.name}
                  onClick={() => { setDarkPreset(i); applyPreset(p) }}
                  className={`flex flex-col gap-2 p-3 rounded-xl border text-left transition-all ${
                    darkPreset === i
                      ? 'border-[#10b981] ring-2 ring-[#10b981]/30'
                      : 'border-brand-border hover:border-[#10b981]/50'
                  }`}
                  style={{ background: p.bg }}
                >
                  <div className="flex gap-1.5">
                    <ColorSwatch hex={p.bg} />
                    <ColorSwatch hex={p.fg} />
                    <ColorSwatch hex={p.accent} />
                  </div>
                  <span className="text-[11px] font-medium leading-tight" style={{ color: p.fg }}>
                    {p.name}
                  </span>
                </button>
              ))}
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
