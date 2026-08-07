"use client";
import { SignOutButton, useAuth, useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { videos, isVideoAvailable } from '@/data/videos';
import { Lock, PlayCircle, Calendar, Menu, X } from 'lucide-react';
import { ProgressBar, MarkCompleteButton, CompletedBadge } from '@/components/progress-tracker';
import { AutolearnBot } from '@/components/autolearn-bot';
import { DashboardWidgets } from '@/components/dashboard-widgets';
import { Leaderboard } from '@/components/leaderboard';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { ThemeToggle } from '@/components/theme-toggle';
import { BadgeDisplay } from '@/components/badges/badge-display';
import { UserBadge as UserBadgeType } from '@/lib/badge-definitions';
import { getLiveClassTimeShort } from '@/config/live-class';

export interface VideoCourse {
  id: string
  title: string
  description: string
  vdoCipherVideoId?: string
  vimeoVideoId?: string
  availableAt: string
  duration: string
  week: number
  resources?: { label: string; url: string }[]
}

export default function DashboardPage() {
  const { isSignedIn } = useAuth()
  const { user } = useUser()
  const [firstName, setFirstName] = useState('Student')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userBadges, setUserBadges] = useState<UserBadgeType[]>([])
  const [nextLesson, setNextLesson] = useState<VideoCourse | null>(null)
  const [profilePicture, setProfilePicture] = useState<string | null>(null)
  const liveClassTime = getLiveClassTimeShort()

  async function fetchProfilePicture() {
    console.log('[Dashboard] fetchProfilePicture called')
    try {
      const response = await fetch('/api/user/profile-picture')
      console.log('[Dashboard] fetchProfilePicture response status:', response.status)
      const result = await response.json()
      console.log('[Dashboard] fetchProfilePicture result:', result)
      if (response.ok) {
        setProfilePicture(result.profilePicture)
        console.log('[Dashboard] fetchProfilePicture success, setProfilePicture called with:', result.profilePicture ? 'data present' : 'null')
      } else {
        console.error('[Dashboard] fetchProfilePicture failed with status:', response.status)
      }
    } catch (error) {
      console.error('[Dashboard] Failed to fetch profile picture:', error)
    }
  }

  async function fetchUserData() {
    if (user?.id) {
      console.log('[Dashboard] fetchUserData - user:', user)
      console.log('[Dashboard] fetchUserData - user.id:', user.id)
      console.log('[Dashboard] fetchUserData - user.firstName:', user.firstName)
      console.log('[Dashboard] fetchUserData - user.fullName:', user.fullName)
      console.log('[Dashboard] fetchUserData - user.username:', user.username)
      console.log('[Dashboard] fetchUserData - user.emailAddresses:', user.emailAddresses)

      // Try to get user's name from enrollments table
      try {
        const response = await fetch(`/api/user/profile`)
        console.log('[Dashboard] fetchUserData - response.ok:', response.ok)
        if (response.ok) {
          const data = await response.json()
          console.log('[Dashboard] fetchUserData - API data:', data)
          // Fallback chain: firstName → fullName → username → email prefix → "Student"
          if (data.firstName) {
            console.log('[Dashboard] Using firstName from API:', data.firstName)
            setFirstName(data.firstName)
          } else if (data.fullName) {
            console.log('[Dashboard] Using fullName from API:', data.fullName)
            setFirstName(data.fullName.split(' ')[0]) // Use first name from full name
          } else if (user?.firstName) {
            console.log('[Dashboard] Using firstName from Clerk:', user.firstName)
            setFirstName(user.firstName)
          } else if (user?.fullName) {
            console.log('[Dashboard] Using fullName from Clerk:', user.fullName)
            setFirstName(user.fullName.split(' ')[0])
          } else if (user?.username) {
            console.log('[Dashboard] Using username from Clerk:', user.username)
            setFirstName(user.username)
          } else if (user?.emailAddresses?.[0]?.emailAddress) {
            console.log('[Dashboard] Using email from Clerk:', user.emailAddresses[0].emailAddress)
            setFirstName(user.emailAddresses[0].emailAddress.split('@')[0])
          } else {
            console.log('[Dashboard] No name found, using "Student"')
            setFirstName('Student')
          }
        } else {
          console.log('[Dashboard] API response not ok, falling back to Clerk')
          // Fallback to Clerk data if API fails
          if (user?.firstName) {
            setFirstName(user.firstName)
          } else if (user?.fullName) {
            setFirstName(user.fullName.split(' ')[0])
          } else if (user?.username) {
            setFirstName(user.username)
          } else if (user?.emailAddresses?.[0]?.emailAddress) {
            setFirstName(user.emailAddresses[0].emailAddress.split('@')[0])
          } else {
            setFirstName('Student')
          }
        }
      } catch (error) {
        console.error('[Dashboard] Failed to fetch user profile:', error)
        // Fallback to Clerk data
        if (user?.firstName) {
          setFirstName(user.firstName)
        } else if (user?.fullName) {
          setFirstName(user.fullName.split(' ')[0])
        } else if (user?.username) {
          setFirstName(user.username)
        } else if (user?.emailAddresses?.[0]?.emailAddress) {
          setFirstName(user.emailAddresses[0].emailAddress.split('@')[0])
        } else {
          setFirstName('Student')
        }
      }
    }
  }

  async function fetchBadges() {
    try {
      console.log('[Dashboard] Fetching badges for user:', user?.id)
      const response = await fetch('/api/badges')
      if (response.ok) {
        const data = await response.json()
        console.log('[Dashboard] Badges received:', data.badges)
        setUserBadges((data.badges || []) as UserBadgeType[])
      } else {
        console.error('[Dashboard] Failed to fetch badges:', response.status)
      }
    } catch (error) {
      console.error('[Dashboard] Failed to fetch badges:', error)
    }
  }

  async function fetchNextLesson() {
    try {
      const response = await fetch('/api/progress')
      if (response.ok) {
        const data = await response.json()
        // Find the first available video that hasn't been completed
        const availableVideos = videos.filter(isVideoAvailable)
        const completedVideoIds = data.completedLessons || []
        const nextVideo = availableVideos.find(v => !completedVideoIds.includes(v.id))
        setNextLesson(nextVideo || null)
      }
    } catch (error) {
      console.error('[Dashboard] Failed to fetch next lesson:', error)
    }
  }

  useEffect(() => {
    fetchUserData()
    fetchBadges()
    fetchNextLesson()
    fetchProfilePicture()
  }, [])

  // Refetch profile picture when returning from settings
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchProfilePicture()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const formatAvailableDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  const weeks = Array.from(new Set(videos.map((v) => v.week))).sort((a, b) => a - b);

  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] text-[var(--foreground)]">
        <h2 className="mb-6 text-2xl font-bold">Please sign in to access the curriculum</h2>
        <Link
          href="/sign-in"
          className="font-mono text-sm font-bold uppercase text-primary border border-primary px-6 py-3 hover:bg-primary hover:text-[var(--text-primary)] transition-colors"
        >
          Login
        </Link>
        <p className="mt-4 text-sm text-[var(--text-muted)]">Don't have an account?{' '}
          <Link href="/sign-up" className="text-primary hover:underline ml-1">Sign Up</Link>
        </p>
      </div>
    );
  }


  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <nav className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-[var(--background)]/95 px-4 backdrop-blur sm:px-6">
        <Link className="flex items-center gap-2 font-mono text-sm font-bold uppercase text-[var(--text-primary)]" href="/">
          <span className="text-primary">//</span>
          <span className="underline decoration-[#b9cacb] decoration-2 underline-offset-2">AutoLearn Spot</span>
        </Link>
        <div className="flex items-center gap-4 md:gap-6">
          <div className="hidden items-center gap-6 md:flex">
            <Link href="/dashboard" className="font-mono text-xs uppercase text-[var(--text-muted)] hover:text-primary transition-colors">
              Home
            </Link>
            <Link href="/live-class" className="font-mono text-xs uppercase text-[var(--text-muted)] hover:text-primary transition-colors">
              Live Class
            </Link>
            <Link href="/dashboard/quiz" className="font-mono text-xs uppercase text-[var(--text-muted)] hover:text-primary transition-colors">
              Quiz
            </Link>
            <Link href="/dashboard/assignments" className="font-mono text-xs uppercase text-[var(--text-muted)] hover:text-primary transition-colors">
              Assignments
            </Link>
            <Link href="/dashboard/leaderboard" className="font-mono text-xs uppercase text-[var(--text-muted)] hover:text-primary transition-colors">
              Leaderboard
            </Link>
            <Link href="/dashboard/history" className="font-mono text-xs uppercase text-[var(--text-muted)] hover:text-primary transition-colors">
              History
            </Link>
            <Link href="/dashboard/analytics" className="font-mono text-xs uppercase text-[var(--text-muted)] hover:text-primary transition-colors">
              Analytics
            </Link>
            <Link href="/dashboard/refer-and-earn" className="font-mono text-xs uppercase text-[var(--text-muted)] hover:text-primary transition-colors">
              Refer & Earn
            </Link>
            <Link href="/dashboard/settings" className="font-mono text-xs uppercase text-[var(--text-muted)] hover:text-primary transition-colors">
              Settings
            </Link>
            <Link href="/admin" className="font-mono text-xs uppercase text-[var(--text-muted)] hover:text-primary transition-colors">
              Admin
            </Link>
          </div>
          
          <NotificationBell />
          <ThemeToggle />
          
          <div className="hidden md:flex items-center gap-4">
            <Link href="/dashboard/settings" className="relative group">
              {profilePicture ? (
                <img 
                  src={profilePicture} 
                  alt="Profile" 
                  className="w-10 h-10 rounded-full object-cover border-2 border-border group-hover:border-primary transition-colors"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[var(--surface)] border-2 border-border group-hover:border-primary transition-colors flex items-center justify-center">
                  <span className="text-[var(--text-muted)] group-hover:text-primary transition-colors text-sm font-bold">
                    {firstName.charAt(0)}
                  </span>
                </div>
              )}
            </Link>
            
            <SignOutButton redirectUrl="/">
              <button className="font-mono text-xs uppercase text-[var(--text-muted)] hover:text-primary transition-colors border border-border px-3 py-1 bg-[var(--surface)] cursor-pointer">
                Sign Out
              </button>
            </SignOutButton>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed right-0 top-0 h-full w-64 bg-[var(--background)] border-l border-border p-6 pt-20 overflow-y-auto">
            <div className="flex flex-col items-center gap-4 mb-6">
              <Link
                href="/dashboard/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="relative group"
              >
                {profilePicture ? (
                  <img 
                    src={profilePicture} 
                    alt="Profile" 
                    className="w-16 h-16 rounded-full object-cover border-2 border-border group-hover:border-primary transition-colors"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[var(--surface)] border-2 border-border group-hover:border-primary transition-colors flex items-center justify-center">
                    <span className="text-[var(--text-muted)] group-hover:text-primary transition-colors text-xl font-bold">
                      {firstName.charAt(0)}
                    </span>
                  </div>
                )}
              </Link>
              <p className="text-sm font-medium text-[var(--text-primary)]">{firstName}</p>
              <ThemeToggle />
            </div>
            <div className="flex flex-col gap-4">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--primary)]"
              >
                Home
              </Link>
              <Link
                href="/live-class"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--primary)]"
              >
                Live Class
              </Link>
              <Link
                href="/dashboard/quiz"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--primary)]"
              >
                Quiz
              </Link>
              <Link
                href="/dashboard/assignments"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--primary)]"
              >
                Assignments
              </Link>
              <Link
                href="/dashboard/leaderboard"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--primary)]"
              >
                Leaderboard
              </Link>
              <Link
                href="/dashboard/history"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--primary)]"
              >
                History
              </Link>
              <Link
                href="/dashboard/analytics"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--primary)]"
              >
                Analytics
              </Link>
              <Link
                href="/dashboard/refer-and-earn"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--primary)]"
              >
                Refer & Earn
              </Link>
              <Link
                href="/dashboard/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--primary)]"
              >
                Settings
              </Link>
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--primary)]"
              >
                Admin
              </Link>
              <div className="border-t border-border pt-4">
                <SignOutButton redirectUrl="/">
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full font-mono text-xs uppercase text-[var(--text-muted)] hover:text-primary transition-colors border border-border px-3 py-2 bg-[var(--surface)] cursor-pointer"
                  >
                    Sign Out
                  </button>
                </SignOutButton>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="mb-8 border-l-4 border-primary bg-primary/10 p-4">
          <p className="font-mono text-sm text-[var(--foreground)] leading-relaxed">
            <strong className="text-primary">Instructor Announcement:</strong> Welcome to the July 13th Cohort, {firstName}! Our first live session is this Saturday at {liveClassTime}.
          </p>
        </div>

        {/* Badges Section */}
        {userBadges.length > 0 && (
          <div className="mb-8 p-4 border border-[var(--border-default)] bg-[var(--card)] rounded-2xl shadow-sm hover:shadow-lg hover:border-[var(--primary)] transition-all">
            <h3 className="font-heading text-lg font-semibold text-[var(--text-primary)] mb-3">Your Achievements</h3>
            <BadgeDisplay userBadges={userBadges} maxDisplay={5} size="md" />
          </div>
        )}

        {/* Next Lesson / Continue Learning */}
        {nextLesson && (
          <div className="mb-8 p-4 border border-[var(--border-default)] bg-primary/5 rounded-2xl shadow-sm hover:shadow-lg hover:border-[var(--primary)] transition-all">
            <div className="flex items-start gap-4">
              <PlayCircle className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-heading text-lg font-semibold text-[var(--text-primary)] mb-2">Continue Learning</h3>
                <p className="font-mono text-sm text-[var(--text-muted)] mb-3">
                  Next Lesson: <span className="text-[var(--text-primary)] font-semibold">{nextLesson.title}</span>
                </p>
                <Link
                  href={`/dashboard/video/${nextLesson.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-[var(--text-primary)] font-mono text-xs font-bold uppercase rounded hover:bg-[var(--surface-hover)] transition-colors"
                >
                  <PlayCircle className="h-4 w-4" />
                  Watch Now
                </Link>
              </div>
            </div>
          </div>
        )}

        <DashboardWidgets />

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="mb-12">
              <h1 className="font-heading text-3xl font-bold uppercase text-[var(--foreground)]">Your Curriculum</h1>
              <p className="mt-3 font-mono text-sm text-[var(--text-muted)]">
                Videos are released every Monday, Wednesday, and Friday. Complete each session to stay on track.
              </p>
            </div>
            <ProgressBar totalVideos={videos.filter(isVideoAvailable).length} />
            <div className="space-y-12">
              {weeks.map((week) => (
                <section key={week}>
                  <h2 className="mb-6 border-b border-border pb-2 font-mono text-lg font-semibold uppercase tracking-[0.1em] text-primary">
                    Week {week}
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {videos
                      .filter((v) => v.week === week)
                      .map((video) => {
                        const available = isVideoAvailable(video);
                        return (
                          <div
                            key={video.id}
                            className={`group relative flex flex-col overflow-hidden border border-[var(--border-default)] bg-[var(--surface)] rounded-2xl shadow-sm hover:shadow-lg hover:border-[var(--primary)] transition-all ${
                              available
                                ? ''
                                : 'opacity-60'
                            }`}
                          >
                            {/* Completed badge */}
                            {available && <CompletedBadge videoId={video.id} />}
                            <div className="aspect-video w-full bg-[var(--surface)] p-4 flex items-center justify-center relative">
                              {available ? (
                                <PlayCircle className="h-12 w-12 text-primary opacity-80 group-hover:opacity-100 transition-opacity" />
                              ) : (
                                <Lock className="h-10 w-10 text-[var(--text-muted)]" />
                              )}
                              <div className="absolute top-2 right-2 rounded bg-black/50 px-2 py-1 font-mono text-[10px] text-[var(--text-primary)] backdrop-blur">
                                {video.duration}
                              </div>
                            </div>
                            <div className="flex flex-1 flex-col p-4">
                              <h3 className={`font-semibold ${available ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                                {video.title}
                              </h3>
                              <p className="mt-2 text-sm text-[var(--text-muted)] line-clamp-2 mb-4">
                                {video.description}
                              </p>
                              {available ? (
                                <div className="mt-auto flex items-center justify-between">
                                  <Link
                                    href={`/dashboard/video/${video.id}`}
                                    className="inline-flex items-center justify-center border border-primary bg-primary/10 px-4 py-2 font-mono text-xs font-bold uppercase text-primary transition-colors hover:bg-primary hover:text-[var(--text-primary)]"
                                  >
                                    Watch Session
                                  </Link>
                                  <MarkCompleteButton videoId={video.id} />
                                </div>
                              ) : (
                                <div className="mt-auto flex items-center gap-2 border border-[var(--border-default)] bg-[var(--background)] px-4 py-2 font-mono text-[10px] uppercase text-[var(--text-muted)] rounded-2xl shadow-sm hover:shadow-lg hover:border-[var(--primary)] transition-all">
                                  <Calendar className="h-3 w-3" /> Unlocks {formatAvailableDate(video.availableAt)}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </section>
              ))}
            </div>
          </div>
          <div className="lg:col-span-1">
            <Leaderboard />
          </div>
        </div>
      </div>
      <AutolearnBot context="dashboard" />
    </main>
  );
}
