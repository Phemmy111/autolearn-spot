'use client'

import { useState, useRef, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

// SVG Fallback Animation (for older browsers or if video fails)
const workflowNodes = [
  {
    label: 'Form',
    detail: 'Webhook trigger',
    x: '13%',
    y: '42%',
    tone: 'active',
    delay: '0.45s',
  },
  {
    label: 'IF / Switch',
    detail: 'Route lead',
    x: '49%',
    y: '42%',
    tone: 'cyan',
    delay: '0.9s',
  },
  {
    label: 'Sheets',
    detail: 'Save record',
    x: '68%',
    y: '14%',
    tone: 'brand',
    delay: '1.35s',
  },
  {
    label: 'WhatsApp',
    detail: 'Send reply',
    x: '68%',
    y: '58%',
    tone: 'brand',
    delay: '1.8s',
  },
]

function WorkflowNode({
  node,
}: {
  node: (typeof workflowNodes)[number]
}) {
  return (
    <div
      className={`workflow-node absolute z-10 w-[108px] border bg-[#111317] p-3 shadow-[0_12px_30px_rgba(0,0,0,0.28)] sm:w-[132px] ${
        node.tone === 'active'
          ? 'border-[#00f0ff] shadow-[0_0_18px_rgba(0,240,255,0.22)]'
          : node.tone === 'brand'
            ? 'border-[#00f0ff]/70'
            : 'border-[#1f2229]'
      }`}
      style={{ left: node.x, top: node.y, animationDelay: node.delay }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div
          className={`flex h-8 w-8 items-center justify-center border ${
            node.tone === 'brand'
              ? 'border-[#00f0ff]/70 bg-[#00f0ff]/10 text-[#00f0ff]'
              : 'border-[#00f0ff]/70 bg-[#00f0ff]/10 text-[#00f0ff]'
          }`}
        >
          <div className="h-4 w-4 rounded-full bg-[#00f0ff]" />
        </div>
        <span className="workflow-status-dot h-2 w-2 rounded-full bg-[#00f0ff]" />
      </div>
      <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#e2e2e8] sm:text-[11px]">
        {node.label}
      </h3>
      <p className="mt-1 font-mono text-[10px] text-[#b9cacb]">{node.detail}</p>
    </div>
  )
}

function SVGFallback() {
  return (
    <div className="relative w-full h-full bg-[#050505]">
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(#1f2229_1px,transparent_1px),linear-gradient(90deg,#1f2229_1px,transparent_1px)] [background-size:32px_32px]" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 620 360" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <path d="M92 185 C170 185 162 112 242 112" fill="none" stroke="#3b494b" strokeWidth="1.5" />
        <path d="M335 138 C385 170 390 185 430 185" fill="none" stroke="#3b494b" strokeWidth="1.5" />
        <path d="M512 170 C532 138 535 105 560 86" fill="none" stroke="#3b494b" strokeWidth="1.5" />
        <path d="M512 206 C536 222 535 250 560 266" fill="none" stroke="#3b494b" strokeWidth="1.5" />
        <path
          className="workflow-path workflow-path-1"
          d="M92 185 C170 185 162 112 242 112"
          fill="none"
          stroke="#00f0ff"
          strokeDasharray="10 18"
          strokeLinecap="round"
          strokeWidth="2"
        />
        <path
          className="workflow-path workflow-path-2"
          d="M335 138 C385 170 390 185 430 185"
          fill="none"
          stroke="#00f0ff"
          strokeDasharray="10 18"
          strokeLinecap="round"
          strokeWidth="2"
        />
        <path
          className="workflow-path workflow-path-3"
          d="M512 170 C532 138 535 105 560 86"
          fill="none"
          stroke="#00f0ff"
          strokeDasharray="10 18"
          strokeLinecap="round"
          strokeWidth="2"
        />
        <path
          className="workflow-path workflow-path-4"
          d="M512 206 C536 222 535 250 560 266"
          fill="none"
          stroke="#00f0ff"
          strokeDasharray="10 18"
          strokeLinecap="round"
          strokeWidth="2"
        />
        <circle className="workflow-packet workflow-packet-1" r="4" fill="#00f0ff">
          <animateMotion dur="3.2s" repeatCount="indefinite" path="M92 185 C170 185 162 112 242 112" />
        </circle>
        <circle className="workflow-packet workflow-packet-2" r="4" fill="#00f0ff">
          <animateMotion begin="0.7s" dur="3.2s" repeatCount="indefinite" path="M335 138 C385 170 390 185 430 185" />
        </circle>
        <circle className="workflow-packet workflow-packet-3" r="4" fill="#00f0ff">
          <animateMotion begin="1.3s" dur="3.2s" repeatCount="indefinite" path="M512 170 C532 138 535 105 560 86" />
        </circle>
        <circle className="workflow-packet workflow-packet-4" r="4" fill="#00f0ff">
          <animateMotion begin="1.55s" dur="3.2s" repeatCount="indefinite" path="M512 206 C536 222 535 250 560 266" />
        </circle>
        <circle className="workflow-junction" cx="242" cy="112" r="4" fill="#00f0ff" />
        <circle className="workflow-junction" cx="430" cy="185" r="4" fill="#00f0ff" />
        <circle className="workflow-junction" cx="522" cy="86" r="4" fill="#00f0ff" />
        <circle className="workflow-junction" cx="522" cy="266" r="4" fill="#00f0ff" />
      </svg>

      {workflowNodes.map((node) => (
        <WorkflowNode key={node.label} node={node} />
      ))}
    </div>
  )
}

export function N8nWorkflowPanel() {
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoad = () => setVideoLoaded(true)
    const handleError = () => setVideoError(true)

    video.addEventListener('loadeddata', handleLoad)
    video.addEventListener('error', handleError)

    return () => {
      video.removeEventListener('loadeddata', handleLoad)
      video.removeEventListener('error', handleError)
    }
  }, [])

  return (
    <div className="relative z-10 w-full border border-[#1f2229] bg-[#0c0e12] rounded-2xl overflow-hidden">
      {/* 16:9 Video Container */}
      <div className="relative w-full aspect-video bg-[#050505]">
        {/* Loading State */}
        {!videoLoaded && !videoError && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#050505]">
            <Loader2 className="h-8 w-8 text-[#00f0ff] animate-spin" />
          </div>
        )}

        {/* Video Element */}
        {!videoError && (
          <video
            ref={videoRef}
            src="/videos/workflow.mp4"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className={`w-full h-full object-cover transition-opacity duration-500 ${
              videoLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        {/* SVG Fallback (shown if video fails or for older browsers) */}
        {videoError && <SVGFallback />}
      </div>
    </div>
  )
}