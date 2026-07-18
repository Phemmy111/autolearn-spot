'use client'

import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { PlayCircle, Download, Award, Lock, FileText, ExternalLink, Loader2 } from 'lucide-react'
import { videos, isVideoAvailable } from '@/data/videos'

function getStorageKey(userId: string) {
  return `autolearn-progress-${userId}`
}

function getCompletedVideos(userId?: string | null): string[] {
  if (typeof window === 'undefined') return []
  try {
    // Try user-specific key first, then fallback to old key
    if (userId) {
      const raw = localStorage.getItem(getStorageKey(userId))
      if (raw) return JSON.parse(raw)
    }
    const raw = localStorage.getItem('autolearn-completed-videos')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function DashboardWidgets() {
  const { userId } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [completedIds, setCompletedIds] = useState<string[]>([])
  const [certEnabled, setCertEnabled] = useState(false)
  const [certLoading, setCertLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [fullName, setFullName] = useState('Student')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    setMounted(true)
    setCompletedIds(getCompletedVideos(userId))

    const handleProgressUpdate = () => {
      setCompletedIds(getCompletedVideos(userId))
    }
    window.addEventListener('autolearn-progress-updated', handleProgressUpdate)
    window.addEventListener('progress-updated', handleProgressUpdate)
    return () => {
      window.removeEventListener('autolearn-progress-updated', handleProgressUpdate)
      window.removeEventListener('progress-updated', handleProgressUpdate)
    }
  }, [userId])

  // Fetch certificate status from API
  useEffect(() => {
    async function fetchCertStatus() {
      try {
        const res = await fetch('/api/certificate/status')
        const data = await res.json()
        setCertEnabled(data.enabled)
        if (data.fullName) setFullName(data.fullName)
      } catch {
        setCertEnabled(false)
      } finally {
        setCertLoading(false)
      }
    }
    fetchCertStatus()
  }, [])

  if (!mounted) return null

  const availableVideos = videos.filter(isVideoAvailable)
  const nextVideo = availableVideos.find(v => !completedIds.includes(v.id))
  
  const isEligibleForCert = availableVideos.length > 0 && availableVideos.every(v => completedIds.includes(v.id))
  const isCourseFullyReleased = videos.length >= 12 && videos.every(isVideoAvailable)
  const canDownloadCert = certEnabled && isCourseFullyReleased && isEligibleForCert

  async function generateCertificate() {
    setGenerating(true)
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas not supported')

      // Load template image
      const templateImg = await loadImage('/certificate-template.jpg')
      canvas.width = templateImg.width
      canvas.height = templateImg.height
      ctx.drawImage(templateImg, 0, 0)

      // Load and draw signature
      try {
        const signatureImg = await loadImage('/signature.jpg')
        // Draw signature in the bottom-right area (signature line area)
        const sigWidth = 200
        const sigHeight = (signatureImg.height / signatureImg.width) * sigWidth
        const sigX = canvas.width * 0.68
        const sigY = canvas.height * 0.78
        ctx.drawImage(signatureImg, sigX, sigY, sigWidth, sigHeight)
      } catch {
        console.warn('Signature image not found, skipping')
      }

      // Draw student name (elegant script font)
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'center'
      ctx.font = 'italic 64px Georgia, "Times New Roman", serif'
      ctx.fillText(fullName, canvas.width / 2, canvas.height * 0.45)

      // Draw decorative line under name
      ctx.strokeStyle = '#00f0ff'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(canvas.width * 0.25, canvas.height * 0.48)
      ctx.lineTo(canvas.width * 0.75, canvas.height * 0.48)
      ctx.stroke()

      // Draw completion date
      const today = new Date()
      const dateStr = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      ctx.fillStyle = '#b9cacb'
      ctx.font = '24px Georgia, serif'
      ctx.textAlign = 'left'
      ctx.fillText(dateStr, canvas.width * 0.08, canvas.height * 0.88)

      // Generate and draw QR code
      try {
        const QRCode = (await import('qrcode')).default
        const verifyUrl = `${window.location.origin}/certificate/verify?name=${encodeURIComponent(fullName)}&date=${encodeURIComponent(dateStr)}`
        const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
          width: 100,
          margin: 1,
          color: { dark: '#000000', light: '#ffffff' },
        })
        const qrImg = await loadImage(qrDataUrl)
        ctx.drawImage(qrImg, canvas.width * 0.88, canvas.height * 0.78, 100, 100)
      } catch {
        console.warn('QR code generation failed, skipping')
      }

      // Download the certificate
      const link = document.createElement('a')
      link.download = `Autolearn-Spot-Certificate-${fullName.replace(/\s+/g, '-')}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('Certificate generation failed:', err)
      alert('Failed to generate certificate. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }

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
            <p className="text-sm text-[#e2e8e2] font-semibold">You&apos;re all caught up!</p>
            <p className="text-xs text-[#5d5f63] mt-1">Wait for the next session release.</p>
          </div>
        )}
      </div>

      {/* Certificate Widget */}
      <div className="border border-[#1f2229] bg-[#0c0e12] p-5 flex flex-col">
        <h3 className="font-mono text-[10px] uppercase tracking-wider text-[#b9cacb] mb-4">Achievement</h3>
        <div className="flex-1 flex flex-col items-center justify-center text-center border border-dashed border-[#1f2229] p-4 bg-[#111317]">
          {certLoading ? (
            <Loader2 className="h-8 w-8 animate-spin text-[#3b494b]" />
          ) : canDownloadCert ? (
            <>
              <Award className="h-10 w-10 text-[#00f0ff] mb-2 drop-shadow-[0_0_8px_rgba(0,240,255,0.5)]" />
              <p className="text-sm text-white font-semibold mb-3">Course Completed!</p>
              <button
                onClick={generateCertificate}
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 bg-[#00f0ff] text-black py-2 font-mono text-[10px] font-bold uppercase hover:bg-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Download className="h-3 w-3" />
                )}
                {generating ? 'Generating...' : 'Download Certificate'}
              </button>
            </>
          ) : (
            <>
              <Lock className="h-8 w-8 text-[#3b494b] mb-2" />
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

      {/* Hidden canvas for certificate generation */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}
