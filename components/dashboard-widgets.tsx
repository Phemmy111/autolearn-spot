'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { PlayCircle, Download, Award, Lock, FileText, ExternalLink, Loader2 } from 'lucide-react'
import { videos, isVideoAvailable } from '@/data/videos'
import { useProgress } from '@/hooks/useProgress'

export function DashboardWidgets() {
  const { userId } = useAuth()
  const { completedIds } = useProgress()
  const [mounted, setMounted] = useState(false)
  const [certEnabled, setCertEnabled] = useState(false)
  const [certEligible, setCertEligible] = useState(false)
  const [certLoading, setCertLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [fullName, setFullName] = useState('Student')
  const [certError, setCertError] = useState<{message: string, requestId?: string | null} | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const fetchCertStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/certificate/status')
      const data = await res.json()
      setCertEnabled(!!data.enabled)
      setCertEligible(!!data.eligible)
      if (data.fullName) setFullName(data.fullName)
    } catch {
      setCertEnabled(false)
      setCertEligible(false)
    } finally {
      setCertLoading(false)
    }
  }, [])

  useEffect(() => {
    setMounted(true)

    const handleCertUnlocked = () => {
      fetchCertStatus()
    }

    window.addEventListener('certificate-unlocked', handleCertUnlocked)

    return () => {
      window.removeEventListener('certificate-unlocked', handleCertUnlocked)
    }
  }, [fetchCertStatus])

  // Fetch certificate status from API on mount
  useEffect(() => {
    fetchCertStatus()
  }, [fetchCertStatus])

  if (!mounted) return null

  const availableVideos = videos.filter(isVideoAvailable)
  const nextVideo = availableVideos.find(v => !completedIds.includes(v.id))
  
  const isEligibleForCert = (availableVideos.length > 0 && availableVideos.every(v => completedIds.includes(v.id))) || certEligible
  const canDownloadCert = certEnabled && isEligibleForCert

  async function generateCertificate(format: 'pdf' | 'png' | 'svg' = 'pdf') {
    setGenerating(true)
    setCertError(null)
    try {
      const res = await fetch(`/api/certificate/download?format=${format}`)
      if (!res.ok) {
        const requestId = res.headers.get('x-vercel-id');
        throw new Error(JSON.stringify({ message: 'Failed to generate certificate. Please try again.', requestId }));
      }
      
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `Autolearn-Spot-Certificate-${fullName.replace(/\s+/g, '-')}.${format}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      console.error('Certificate generation failed:', err)
      try {
        const parsed = JSON.parse(err.message)
        setCertError(parsed)
      } catch (e) {
        setCertError({ message: 'Failed to generate certificate. Please try again.' })
      }
    } finally {
      setGenerating(false)
    }
  }



  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      {/* Resume Learning Widget */}
      <div className="border border-[var(--border-default)] bg-[var(--card)] p-5 flex flex-col">
        <h3 className="font-mono text-[10px] uppercase tracking-wider text-[#b9cacb] mb-4">Quick Action</h3>
        {nextVideo ? (
          <>
            <h4 className="font-heading text-lg font-bold text-white mb-2 line-clamp-1">{nextVideo.title}</h4>
            <p className="text-sm text-[#5d5f63] mb-4 line-clamp-2">{nextVideo.description}</p>
            <Link 
              href={`/dashboard/video/${nextVideo.id}`}
              className="mt-auto flex items-center justify-center gap-2 border border-[var(--primary)] bg-[var(--primary)]/10 py-3 font-mono text-xs font-bold uppercase text-[var(--primary)] hover:bg-[var(--primary)] hover:text-black transition-colors"
            >
              <PlayCircle className="h-4 w-4" />
              Resume Learning
            </Link>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <Award className="h-8 w-8 text-[var(--primary)] mb-2" />
            <p className="text-sm text-[#e2e8e2] font-semibold">You&apos;re all caught up!</p>
            <p className="text-xs text-[#5d5f63] mt-1">Wait for the next session release.</p>
          </div>
        )}
      </div>

      {/* Certificate Widget */}
      <div className="border border-[var(--border-default)] bg-[var(--card)] p-5 flex flex-col">
        <h3 className="font-mono text-[10px] uppercase tracking-wider text-[#b9cacb] mb-4">Achievement</h3>
        <div className="flex-1 flex flex-col items-center justify-center text-center border border-dashed border-[var(--border-default)] p-4 bg-[var(--surface-hover)]">
          {certLoading ? (
            <Loader2 className="h-8 w-8 animate-spin text-[var(--border-input)]" />
          ) : canDownloadCert ? (
            <>
              <Award className="h-10 w-10 text-[var(--primary)] mb-2 drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]" />
              <p className="text-sm text-white font-semibold mb-3">Course Completed!</p>
              <div className="flex gap-2 w-full">
                <button
                  onClick={() => generateCertificate('pdf')}
                  disabled={generating}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[var(--primary)] to-[#0080ff] text-black font-bold py-3 px-4 rounded font-mono text-[10px] uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                  PDF
                </button>
                <button
                  onClick={() => generateCertificate('png')}
                  disabled={generating}
                  className="flex-1 flex items-center justify-center gap-2 border border-[var(--primary)] text-[var(--primary)] py-3 px-4 rounded font-mono text-[10px] font-bold uppercase tracking-wider hover:bg-[var(--primary)] hover:text-black transition-colors disabled:opacity-50"
                >
                  {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                  PNG
                </button>
              </div>
              {certError && (
                <div className="mt-3 text-left w-full bg-red-500/10 border border-red-500/20 p-2 text-xs rounded">
                  <p className="text-red-400 mb-1">{certError.message}</p>
                  {certError.requestId && (
                    <a
                      href={`https://vercel.com/femiadeleke2019-5204s-projects/autolearn-spot/logs?search=${certError.requestId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--primary)] hover:underline flex items-center gap-1 mt-1 font-mono uppercase tracking-wider"
                    >
                      <ExternalLink className="h-3 w-3" /> View Vercel Log
                    </a>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <Lock className="h-8 w-8 text-[var(--border-input)] mb-2" />
              <p className="text-xs text-[#b9cacb] font-semibold">Certificate Locked</p>
              <p className="text-[10px] text-[#5d5f63] mt-2 max-w-[180px]">
                {!certEnabled
                  ? 'Certificates are not yet available.'
                  : 'Complete all 12 sessions to unlock your Moon Space Network certificate.'}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Global Resources Placeholder */}
      <div className="border border-[var(--border-default)] bg-[var(--card)] p-5 flex flex-col">
        <h3 className="font-mono text-[10px] uppercase tracking-wider text-[#b9cacb] mb-4">Global Resources</h3>
        <div className="flex-1 flex flex-col gap-3">
          <div className="flex items-center justify-between p-3 border border-[var(--border-default)] bg-[var(--surface-hover)]">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-[var(--surface-hover)] flex items-center justify-center">
                <FileText className="h-4 w-4 text-[#5d5f63]" />
              </div>
              <div>
                <p className="text-xs text-white font-semibold">Course Slides (PPT)</p>
                <p className="text-[10px] text-[var(--primary)]">Coming Soon</p>
              </div>
            </div>
            <Lock className="h-4 w-4 text-[var(--border-input)]" />
          </div>
          
          <a href="#" className="flex items-center justify-between p-3 border border-[var(--border-default)] bg-[var(--surface-hover)] hover:border-[var(--border-input)] transition-colors group cursor-not-allowed pointer-events-none">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-[var(--surface-hover)] flex items-center justify-center group-hover:bg-[var(--border-input)] transition-colors">
                <ExternalLink className="h-4 w-4 text-[#5d5f63]" />
              </div>
              <div>
                <p className="text-xs text-[#b9cacb] font-semibold">N8n Templates Vault</p>
                <p className="text-[10px] text-[#5d5f63]">Coming Soon</p>
              </div>
            </div>
            <Lock className="h-4 w-4 text-[var(--border-input)]" />
          </a>
        </div>
      </div>


    </div>
  )
}
