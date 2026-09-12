import { redirect } from 'next/navigation'
import { requireSuperAdmin } from '@/lib/admin'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { videos } from '@/data/videos'
import { Metadata } from 'next'
import VideoDebugClient from './client'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Video Debug | Admin | AutoLearn Spot',
  description: 'Validate provider, video ID, thumbnail, and playback for every lesson.',
}

export default async function VideoDebugPage() {
  try {
    await requireSuperAdmin()
  } catch {
    redirect('/admin')
  }

  // Build the lesson manifest to pass to the client
  const lessons = videos.map((v) => ({
    id: v.id,
    title: v.title,
    week: v.week,
    youtubeVideoId: v.youtubeVideoId ?? null,
    vimeoVideoId: v.vimeoVideoId ?? null,
    vdoCipherVideoId: v.vdoCipherVideoId ?? null,
  }))

  return (
    <div className="min-h-screen bg-[#d1d5db]">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-10">
          <Link
            href="/admin"
            className="mb-4 flex items-center gap-2 font-mono text-sm text-neutral-600 transition hover:text-neutral-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </Link>
          <h1 className="font-heading text-3xl font-bold text-neutral-900">
            Video Engine Debug
          </h1>
          <p className="mt-2 font-mono text-sm text-neutral-600">
            Validate provider, video ID, thumbnail, and playback for all 12 lessons.
            Super Admin only.
          </p>
        </div>
        <VideoDebugClient lessons={lessons} />
      </div>
    </div>
  )
}
