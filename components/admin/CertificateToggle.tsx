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
      <div className="flex items-center gap-2 border border-neutral-200 bg-neutral-50 px-4 py-2 rounded">
        <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
        <span className="font-mono text-xs text-neutral-500">Loading...</span>
      </div>
    )
  }

  return (
    <button
      onClick={handleToggle}
      disabled={toggling}
      className={`flex items-center gap-2 font-bold uppercase tracking-wider font-mono px-6 py-2 rounded text-sm transition-colors ${
        enabled
          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 shadow-sm'
          : 'bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 shadow-sm'
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
