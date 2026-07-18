'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { Award, CheckCircle, ExternalLink } from 'lucide-react'

function CertificateVerifyContent() {
  const searchParams = useSearchParams()
  const name = searchParams.get('name')
  const date = searchParams.get('date')

  if (!name || !date) {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center p-4">
        <div className="border border-red-500/30 bg-red-500/10 p-8 text-center max-w-md">
          <p className="text-red-400 font-mono text-sm">Invalid or expired certificate link.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center p-4">
      <div className="border border-[#1f2229] bg-[#0c0e12] p-8 max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/50 mb-4">
            <CheckCircle className="h-8 w-8 text-emerald-400" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-white mb-2">Certificate Verified</h1>
          <p className="font-mono text-xs text-[#b9cacb] uppercase tracking-wider">
            Autolearn Spot • Powered by Moon Space Network
          </p>
        </div>

        {/* Certificate Details */}
        <div className="border border-[#1f2229] bg-[#111317] p-6 space-y-4 mb-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#5d5f63] mb-1">Recipient</p>
            <p className="text-lg text-white font-semibold">{decodeURIComponent(name)}</p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#5d5f63] mb-1">Course</p>
            <p className="text-[#00f0ff] font-semibold">n8n Automation</p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#5d5f63] mb-1">Completion Date</p>
            <p className="text-[#b9cacb]">{decodeURIComponent(date)}</p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#5d5f63] mb-1">Issued By</p>
            <p className="text-[#b9cacb]">Moon Space Network (MSN)</p>
          </div>
        </div>

        {/* Verification Badge */}
        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 p-3 mb-6">
          <Award className="h-5 w-5 text-emerald-400 flex-shrink-0" />
          <p className="font-mono text-xs text-emerald-400">
            This certificate is authentic and was issued by Autolearn Spot.
          </p>
        </div>

        {/* Footer Link */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-mono text-xs text-[#00f0ff] hover:text-white transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            Visit Autolearn Spot
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function CertificateVerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
        <p className="text-[#b9cacb] font-mono text-sm">Loading verification...</p>
      </div>
    }>
      <CertificateVerifyContent />
    </Suspense>
  )
}
