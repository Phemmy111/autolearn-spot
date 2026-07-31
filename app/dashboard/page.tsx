"use client";
import { SignOutButton, useAuth } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { videos, isVideoAvailable } from '@/data/videos';
import { Lock, PlayCircle, Calendar, Menu, X } from 'lucide-react';
import { ProgressBar, MarkCompleteButton, CompletedBadge } from '@/components/progress-tracker';
import { AutolearnBot } from '@/components/autolearn-bot';
import { DashboardWidgets } from '@/components/dashboard-widgets';
import { Leaderboard } from '@/components/leaderboard';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { BadgeDisplay } from '@/components/badges/badge-display';
import { UserBadge } from '@/lib/badge-definitions';
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
  const { isSignedIn, user } = useAuth()
  const [firstName, setFirstName] = useState('Student')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userBadges, setUserBadges] = useState<UserBadge[]>([])
  const [nextLesson, setNextLesson] = useState<VideoCourse | null>(null)
  const liveClassTime = getLiveClassTimeShort()

  useEffect(() => {
    async function fetchUserData() {
      if (user?.id) {
        // Try to get user's name from enrollments table
        try {
          const response = await fetch(`/api/user/profile`)
          if (response.ok) {
            const data = await response.json()
            // Fallback chain: firstName → fullName → username → email prefix → "Student"
            if (data.firstName) {
              setFirstName(data.firstName)
            } else if (data.fullName) {
              setFirstName(data.fullName.split(' ')[0]) // Use first name from full name
            } else if (user?.firstName) {
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
          } else {
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
          setUserBadges(data.badges || [])
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
    
    if (isSignedIn) {
      fetchUserData()
      fetchBadges()
      fetchNextLesson()
    }
  }, [isSignedIn, user?.id, user?.firstName, user?.fullName, user?.username, user?.emailAddresses])

  const formatAvailableDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  const weeks = Array.from(new Set(videos.map((v) => v.week))).sort((a, b) => a - b);

  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#111317] text-[#e2e8e2]">
        <h2 className="mb-6 text-2xl font-bold">Please sign in to access the curriculum</h2>
        <Link
          href="/sign-in"
          className="font-mono text-sm font-bold uppercase text-[#00f0ff] border border-[#00f0ff] px-6 py-3 hover:bg-[#00f0ff] hover:text-black transition-colors"
        >
          Login
        </Link>
        <p className="mt-4 text-sm text-[#b9cacb]">Don't have an account?{' '}
          <Link href="/sign-up" className="text-[#00f0ff] hover:underline ml-1">Sign Up</Link>
        </p>
      </div>
    );
  }


  return (
    <main className="min-h-screen bg-[#111317] text-[#e2e8e2]">
      <nav className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-[#3b494b] bg-[#111317]/95 px-4 backdrop-blur sm:px-6">
        <Link className="flex items-center gap-2 font-mono text-sm font-bold uppercase text-white" href="/">
          <span className="text-[#00f0ff]">//</span>
          <span className="underline decoration-[#b9cacb] decoration-2 underline-offset-2">AutoLearn Spot</span>
        </Link>
        <div className="flex items-center gap-4 md:gap-6">
          <div className="hidden items-center gap-6 md:flex">
            <Link href="/dashboard" className="font-mono text-xs uppercase text-[#b9cacb] hover:text-[#00f0ff] transition-colors">
              Home
            </Link>
            <Link href="/live-class" className="font-mono text-xs uppercase text-[#b9cacb] hover:text-[#00f0ff] transition-colors">
              Live Class
            </Link>
            <Link href="/dashboard/quiz" className="font-mono text-xs uppercase text-[#b9cacb] hover:text-[#00f0ff] transition-colors">
              Quiz
            </Link>
            <Link href="/dashboard/assignments" className="font-mono text-xs uppercase text-[#b9cacb] hover:text-[#00f0ff] transition-colors">
              Assignments
            </Link>
            <Link href="/dashboard/leaderboard" className="font-mono text-xs uppercase text-[#b9cacb] hover:text-[#00f0ff] transition-colors">
              Leaderboard
            </Link>
            <Link href="/dashboard/history" className="font-mono text-xs uppercase text-[#b9cacb] hover:text-[#00f0ff] transition-colors">
              History
            </Link>
            <Link href="/dashboard/analytics" className="font-mono text-xs uppercase text-[#b9cacb] hover:text-[#00f0ff] transition-colors">
              Analytics
            </Link>
            <Link href="/admin" className="font-mono text-xs uppercase text-[#b9cacb] hover:text-[#00f0ff] transition-colors">
              Admin
            </Link>
          </div>
          
          <NotificationBell />
          
          <div className="hidden md:block">
            <SignOutButton redirectUrl="/">
              <button className="font-mono text-xs uppercase text-[#b9cacb] hover:text-[#00f0ff] transition-colors border border-[#3b494b] px-3 py-1 bg-[#1a1d24] cursor-pointer">
                Sign Out
              </button>
            </SignOutButton>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#b9cacb] hover:text-white"
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
          <div className="fixed right-0 top-0 h-full w-64 bg-[#111317] border-l border-[#3b494b] p-6">
            <div className="flex flex-col gap-4">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[#b9cacb] transition hover:bg-[#1a1c20] hover:text-[#dbfcff]"
              >
                Home
              </Link>
              <Link
                href="/live-class"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[#b9cacb] transition hover:bg-[#1a1c20] hover:text-[#dbfcff]"
              >
                Live Class
              </Link>
              <Link
                href="/dashboard/quiz"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[#b9cacb] transition hover:bg-[#1a1c20] hover:text-[#dbfcff]"
              >
                Quiz
              </Link>
              <Link
                href="/dashboard/assignments"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[#b9cacb] transition hover:bg-[#1a1c20] hover:text-[#dbfcff]"
              >
                Assignments
              </Link>
              <Link
                href="/dashboard/leaderboard"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[#b9cacb] transition hover:bg-[#1a1c20] hover:text-[#dbfcff]"
              >
                Leaderboard
              </Link>
              <Link
                href="/dashboard/history"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[#b9cacb] transition hover:bg-[#1a1c20] hover:text-[#dbfcff]"
              >
                History
              </Link>
              <Link
                href="/dashboard/analytics"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[#b9cacb] transition hover:bg-[#1a1c20] hover:text-[#dbfcff]"
              >
                Analytics
              </Link>
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[#b9cacb] transition hover:bg-[#1a1c20] hover:text-[#dbfcff]"
              >
                Admin
              </Link>
              <div className="border-t border-[#1f2229] pt-4">
                <SignOutButton redirectUrl="/">
                  <button 
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full font-mono text-xs uppercase text-[#b9cacb] hover:text-[#00f0ff] transition-colors border border-[#3b494b] px-3 py-2 bg-[#1a1d24] cursor-pointer"
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
        <div className="mb-8 border-l-4 border-[#00f0ff] bg-[#00f0ff]/10 p-4">
          <p className="font-mono text-sm text-[#e2e8e2] leading-relaxed">
            <strong className="text-[#00f0ff]">Instructor Announcement:</strong> Welcome to the July 13th Cohort, {firstName}! Our first live session is this Saturday at {liveClassTime}.
          </p>
        </div>

        {/* Badges Section */}
        {userBadges.length > 0 && (
          <div className="mb-8 p-4 border border-[#1f2229] bg-[#0c0e12] rounded-lg">
            <h3 className="font-heading text-lg font-semibold text-white mb-3">Your Achievements</h3>
            <BadgeDisplay userBadges={userBadges} maxDisplay={5} size="md" />
          </div>
        )}

        {/* Next Lesson / Continue Learning */}
        {nextLesson && (
          <div className="mb-8 p-4 border border-[#00f0ff]/30 bg-[#00f0ff]/5 rounded-lg">
            <div className="flex items-start gap-4">
              <PlayCircle className="h-8 w-8 text-[#00f0ff] flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-heading text-lg font-semibold text-white mb-2">Continue Learning</h3>
                <p className="font-mono text-sm text-[#b9cacb] mb-3">
                  Next Lesson: <span className="text-white font-semibold">{nextLesson.title}</span>
                </p>
                <Link
                  href={`/dashboard/video/${nextLesson.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#00f0ff] text-black font-mono text-xs font-bold uppercase rounded hover:bg-white transition-colors"
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
              <h1 className="font-heading text-3xl font-bold uppercase text-[#e2e8e2]">Your Curriculum</h1>
              <p className="mt-3 font-mono text-sm text-[#b9cacb]">
                Videos are released every Monday, Wednesday, and Friday. Complete each session to stay on track.
              </p>
            </div>
            <ProgressBar totalVideos={videos.filter(isVideoAvailable).length} />
            <div className="space-y-12">
              {weeks.map((week) => (
                <section key={week}>
                  <h2 className="mb-6 border-b border-[#1f2229] pb-2 font-mono text-lg font-semibold uppercase tracking-[0.1em] text-[#00f0ff]">
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
                            className={`group relative flex flex-col overflow-hidden border ${
                              available
                                ? 'border-[#3b494b] bg-[#1a1d24] hover:border-[#00f0ff]'
                                : 'border-[#1f2229] bg-[#111317] opacity-60'
                            } transition-colors`}
                          >
                            {/* Completed badge */}
                            {available && <CompletedBadge videoId={video.id} />}
                            <div className="aspect-video w-full bg-[#0a0c10] p-4 flex items-center justify-center relative">
                              {available ? (
                                <PlayCircle className="h-12 w-12 text-[#00f0ff] opacity-80 group-hover:opacity-100 transition-opacity" />
                              ) : (
                                <Lock className="h-10 w-10 text-[#5d5f63]" />
                              )}
                              <div className="absolute top-2 right-2 rounded bg-black/50 px-2 py-1 font-mono text-[10px] text-white backdrop-blur">
                                {video.duration}
                              </div>
                            </div>
                            <div className="flex flex-1 flex-col p-4">
                              <h3 className={`font-semibold ${available ? 'text-white' : 'text-[#b9cacb]'}`}>
                                {video.title}
                              </h3>
                              <p className="mt-2 text-sm text-[#5d5f63] line-clamp-2 mb-4">
                                {video.description}
                              </p>
                              {available ? (
                                <div className="mt-auto flex items-center justify-between">
                                  <Link
                                    href={`/dashboard/video/${video.id}`}
                                    className="inline-flex items-center justify-center border border-[#00f0ff] bg-[#00f0ff]/10 px-4 py-2 font-mono text-xs font-bold uppercase text-[#00f0ff] transition-colors hover:bg-[#00f0ff] hover:text-black"
                                  >
                                    Watch Session
                                  </Link>
                                  <MarkCompleteButton videoId={video.id} />
                                </div>
                              ) : (
                                <div className="mt-auto flex items-center gap-2 border border-[#1f2229] bg-[#111317] px-4 py-2 font-mono text-[10px] uppercase text-[#5d5f63]">
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
