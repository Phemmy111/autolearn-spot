'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PlayCircle, Download, Award, Lock, FileText, ExternalLink } from 'lucide-react'
import { videos, isVideoAvailable } from '@/data/videos'

function getCompletedVideos(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem('autolearn-completed-videos')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function DashboardWidgets() {
  const [mounted, setMounted] = useState(false)
  const [completedIds, setCompletedIds] = useState<string[]>([])

  useEffect(() => {
    setMounted(true)
    setCompletedIds(getCompletedVideos())

    // Listen for custom event from progress-tracker
    const handleProgressUpdate = () => {
      setCompletedIds(getCompletedVideos())
    }
    window.addEventListener('autolearn-progress-updated', handleProgressUpdate)
    return () => window.removeEventListener('autolearn-progress-updated', handleProgressUpdate)
  }, [])

  if (!mounted) return null

  const availableVideos = videos.filter(isVideoAvailable)
  const nextVideo = availableVideos.find(v => !completedIds.includes(v.id))
  
  // All released videos must be completed, and there must be at least 1 video available to claim certificate
  const isEligibleForCert = availableVideos.length > 0 && availableVideos.every(v => completedIds.includes(v.id))
  // If course isn't fully released yet (e.g. fewer than 12 sessions), maybe they shouldn't get the certificate yet.
  // But for now we just check if they've completed all *available* videos.
  const isCourseFullyReleased = videos.length >= 12 && videos.every(isVideoAvailable)
  const canDownloadCert = isCourseFullyReleased && isEligibleForCert

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      {/* Resume Learning Widget */}
      <div className="border border-[#1f2229] bg-[#0c0e12] p-5 flex flex-col">
        <h3 className="font-mono text-[10px] uppercase tracking-wider text-[#b9cacb] mb-4">Quick Action</h3>
        {nextVideo ? (
          <>
            <h4 className="font-heading text-lg font-bold text-white mb-2 line-clamp-1">{nextVideo.title}</h4>
            <p className="text-sm text-[#5d5f63] mb-4 line-clamp-2">{nextVideo.description}</p>
            <Link 
              href={`/dashboard/video/${nextVideo.id}`}
              className="mt-auto flex items-center justify-center gap-2 border border-[#00f0ff] bg-[#00f0ff]/10 py-3 font-mono text-xs font-bold uppercase text-[#00f0ff] hover:bg-[#00f0ff] hover:text-black transition-colors"
            >
              <PlayCircle className="h-4 w-4" />
              Resume Learning
            </Link>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <Award className="h-8 w-8 text-[#00f0ff] mb-2" />
            <p className="text-sm text-[#e2e8e2] font-semibold">You're all caught up!</p>
            <p className="text-xs text-[#5d5f63] mt-1">Wait for the next session release.</p>
          </div>
        )}
      </div>

      {/* Certificate Widget */}
      <div className="border border-[#1f2229] bg-[#0c0e12] p-5 flex flex-col">
        <h3 className="font-mono text-[10px] uppercase tracking-wider text-[#b9cacb] mb-4">Achievement</h3>
        <div className="flex-1 flex flex-col items-center justify-center text-center border border-dashed border-[#1f2229] p-4 bg-[#111317]">
          {canDownloadCert ? (
            <>
              <Award className="h-10 w-10 text-[#00f0ff] mb-2 drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]" />
              <p className="text-sm text-white font-semibold mb-3">Course Completed!</p>
              <button className="w-full flex items-center justify-center gap-2 bg-[#00f0ff] text-black py-2 font-mono text-[10px] font-bold uppercase hover:bg-white transition-colors">
                <Download className="h-3 w-3" />
                Download Certificate
              </button>
            </>
          ) : (
            <>
              <Lock className="h-8 w-8 text-[#3b494b] mb-2" />
              <p className="text-xs text-[#b9cacb] font-semibold">Certificate Locked</p>
              <p className="text-[10px] text-[#5d5f63] mt-2 max-w-[180px]">
                Complete all 12 sessions to unlock your Moon Space Network certificate.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Global Resources Placeholder */}
      <div className="border border-[#1f2229] bg-[#0c0e12] p-5 flex flex-col">
        <h3 className="font-mono text-[10px] uppercase tracking-wider text-[#b9cacb] mb-4">Global Resources</h3>
        <div className="flex-1 flex flex-col gap-3">
          <div className="flex items-center justify-between p-3 border border-[#1f2229] bg-[#111317]">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-[#1a1d24] flex items-center justify-center">
                <FileText className="h-4 w-4 text-[#5d5f63]" />
              </div>
              <div>
                <p className="text-xs text-white font-semibold">Course Slides (PPT)</p>
                <p className="text-[10px] text-[#00f0ff]">Coming Soon</p>
              </div>
            </div>
            <Lock className="h-4 w-4 text-[#3b494b]" />
          </div>
          
          <a href="#" className="flex items-center justify-between p-3 border border-[#1f2229] bg-[#111317] hover:border-[#3b494b] transition-colors group cursor-not-allowed pointer-events-none">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-[#1a1d24] flex items-center justify-center group-hover:bg-[#3b494b] transition-colors">
                <ExternalLink className="h-4 w-4 text-[#5d5f63]" />
              </div>
              <div>
                <p className="text-xs text-[#b9cacb] font-semibold">N8n Templates Vault</p>
                <p className="text-[10px] text-[#5d5f63]">Coming Soon</p>
              </div>
            </div>
            <Lock className="h-4 w-4 text-[#3b494b]" />
          </a>
        </div>
      </div>

    </div>
  )
}
