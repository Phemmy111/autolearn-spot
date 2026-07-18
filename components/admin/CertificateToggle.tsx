'use client'

import { useState, useEffect } from 'react'
import { Award, Loader2 } from 'lucide-react'

export function CertificateToggle() {
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    fetchStatus()
  }, [])

  async function fetchStatus() {
    try {
      const res = await fetch('/api/admin/certificate-toggle')
      const data = await res.json()
      setEnabled(data.enabled)
    } catch (err) {
      console.error('Failed to fetch certificate status:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleToggle() {
    setToggling(true)
    try {
      const res = await fetch('/api/admin/certificate-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !enabled }),
      })
      const data = await res.json()
      if (data.success) {
        setEnabled(data.enabled)
      } else {
        alert('Failed to toggle certificate: ' + (data.error || 'Unknown error'))
      }
    } catch (err) {
      console.error('Failed to toggle certificate:', err)
      alert('Failed to toggle certificate setting')
    } finally {
      setToggling(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 border border-[#1f2229] bg-[#0c0e12] px-4 py-2 rounded">
        <Loader2 className="h-4 w-4 animate-spin text-[#b9cacb]" />
        <span className="font-mono text-xs text-[#b9cacb]">Loading...</span>
      </div>
    )
  }

  return (
    <button
      onClick={handleToggle}
      disabled={toggling}
      className={`flex items-center gap-2 font-bold uppercase tracking-wider font-mono px-6 py-2 rounded text-sm transition-colors ${
        enabled
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30'
          : 'bg-amber-500/20 text-amber-400 border border-amber-500/50 hover:bg-amber-500/30'
      } ${toggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {toggling ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Award className="h-4 w-4" />
      )}
      Certificate: {enabled ? 'ON' : 'OFF'}
    </button>
  )
}
