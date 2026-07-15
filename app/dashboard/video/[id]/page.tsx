import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download } from 'lucide-react'
import { videos, isVideoAvailable } from '@/data/videos'
import { auth } from '@clerk/nextjs/server'
import VdoCipherPlayer from '@/components/vdocipher-player'
import VimeoPlayer from '@/components/vimeo-player'
import { AutolearnBot } from '@/components/autolearn-bot'
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

  return (
    <main className="min-h-screen bg-[#111317] text-[#e2e2e8]">
      <nav className="sticky top-0 z-50 flex h-16 items-center border-b border-[#3b494b] bg-[#111317]/95 px-4 backdrop-blur sm:px-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-mono text-xs font-semibold uppercase text-[#b9cacb] transition hover:text-[#00f0ff]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </nav>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <span className="mb-2 inline-block font-mono text-[10px] uppercase tracking-wider text-[#00f0ff]">
            Week {video.week} • {video.duration}
          </span>
          <h1 className="font-heading text-2xl font-bold uppercase text-white sm:text-3xl">
            {video.title}
          </h1>
          <p className="mt-3 max-w-3xl font-mono text-sm leading-relaxed text-[#b9cacb]">
            {video.description}
          </p>
        </div>

        {/* Video Player Container */}
        <div className="relative aspect-video w-full overflow-hidden border border-[#3b494b] bg-black shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          {video.vimeoVideoId ? (
            <VimeoPlayer videoId={video.vimeoVideoId} />
          ) : video.vdoCipherVideoId ? (
            <VdoCipherPlayer videoId={video.vdoCipherVideoId} />
          ) : (
            <div className="flex h-full items-center justify-center font-mono text-sm text-[#b9cacb]">
              Video source not found.
            </div>
          )}
        </div>

        {/* Resources Section */}
        {video.resources && video.resources.length > 0 && (
          <div className="mt-12 border border-[#1f2229] bg-[#0c0e12] p-6 sm:p-8">
            <h2 className="mb-6 font-mono text-lg font-semibold uppercase tracking-wider text-[#00f0ff]">
              Session Resources
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {video.resources.map((resource, i) => (
                <a
                  key={i}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 border border-[#3b494b] bg-[#111317] p-4 transition-colors hover:border-[#00f0ff] hover:bg-[#1a1d24]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#00f0ff]/10 text-[#00f0ff]">
                    <Download className="h-5 w-5" />
                  </div>
                  <span className="font-mono text-sm font-semibold text-[#e2e2e8]">
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
