import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download } from 'lucide-react'
import { videos, isVideoAvailable } from '@/data/videos'
import { auth } from '@clerk/nextjs/server'
import { AutolearnBot } from '@/components/autolearn-bot'
import VideoPlayer from '@/components/video-player'
import { getUserProgress, getCurrentCohortId } from '@/lib/progress-service'

interface VideoPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function VideoPage({ params }: VideoPageProps) {
  const { userId } = await auth()

  if (!userId) {
    redirect('/dashboard')
  }

  const resolvedParams = await params
  const video = videos.find((v) => v.id === resolvedParams.id)

  if (!video) {
    notFound()
  }

  if (!isVideoAvailable(video)) {
    redirect('/dashboard')
  }

  // Fetch saved progress so the player can resume from the last position
  let resumeFromSeconds = 0
  try {
    const cohortId = await getCurrentCohortId()
    const progressRows = await getUserProgress(userId, cohortId)
    const row = progressRows.find((p) => p.lesson_id === video.id)
    // Only resume if not yet completed and position is meaningful (> 5s)
    if (row && !row.completed && row.last_position_seconds > 5) {
      resumeFromSeconds = row.last_position_seconds
    }
  } catch {
    // Non-fatal — player will start from the beginning
  }

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <nav className="sticky top-0 z-50 flex h-16 items-center border-b border-[var(--border-default)] bg-[var(--background)]/95 px-4 backdrop-blur sm:px-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-mono text-xs font-semibold uppercase text-[var(--text-muted)] transition hover:text-[var(--primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </nav>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <span className="mb-2 inline-block font-mono text-[10px] uppercase tracking-wider text-[var(--primary)]">
            Week {video.week} • {video.duration}
          </span>
          <h1 className="font-heading text-2xl font-bold uppercase text-[var(--text-primary)] sm:text-3xl">
            {video.title}
          </h1>
          <p className="mt-3 max-w-3xl font-mono text-sm leading-relaxed text-[var(--text-muted)]">
            {video.description}
          </p>
        </div>

        {/* Video Player Container */}
        <div className="relative aspect-video w-full overflow-hidden border border-[var(--border-default)] bg-black shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          <VideoPlayer
            lessonId={video.id}
            youtubeVideoId={video.youtubeVideoId}
            vimeoVideoId={video.vimeoVideoId}
            vdoCipherVideoId={video.vdoCipherVideoId}
            resumeFromSeconds={resumeFromSeconds}
          />
        </div>

        {/* Resources Section */}
        {video.resources && video.resources.length > 0 && (
          <div className="mt-12 border border-[var(--border-default)] bg-[var(--card)] p-6 sm:p-8 shadow-sm">
            <h2 className="mb-6 font-mono text-lg font-semibold uppercase tracking-wider text-[var(--primary)]">
              Session Resources
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {video.resources.map((resource, i) => (
                <a
                  key={i}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 border border-[var(--border-default)] bg-[var(--background)] p-4 transition-colors hover:border-[var(--primary)] hover:bg-[var(--surface-hover)]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[var(--primary-light)] text-[var(--primary)]">
                    <Download className="h-5 w-5" />
                  </div>
                  <span className="font-mono text-sm font-semibold text-[var(--text-primary)]">
                    {resource.label}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
      <AutolearnBot context="dashboard" />
    </main>
  )
}
