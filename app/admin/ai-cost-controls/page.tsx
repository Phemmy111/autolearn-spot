'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Settings, 
  Save,
  RefreshCw,
  DollarSign,
  Clock,
  Zap,
  Shield
} from 'lucide-react'

interface CostControls {
  max_tokens: number
  temperature: number
  daily_request_limit: number
  monthly_request_limit: number
  max_retries: number
  request_timeout_ms: number
  enabled: boolean
}

export default function AICostControlsPage() {
  const router = useRouter()
  const [controls, setControls] = useState<CostControls>({
    max_tokens: 4000,
    temperature: 0.7,
    daily_request_limit: 100,
    monthly_request_limit: 3000,
    max_retries: 3,
    request_timeout_ms: 30000,
    enabled: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const fetchControls = async () => {
    try {
      const res = await fetch('/api/admin/ai-cost-controls')
      if (!res.ok) {
        if (res.status === 403) {
          router.push('/admin')
          return
        }
        throw new Error('Failed to fetch cost controls')
      }
      const data = await res.json()
      setControls(data)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load cost controls')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchControls()
  }, [router])

  const handleSave = async () => {
    setSaving(true)
    setSuccess(false)
    setError(null)

    try {
      const res = await fetch('/api/admin/ai-cost-controls', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(controls),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to save cost controls')
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to save cost controls')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-[#00f0ff] animate-spin mx-auto mb-4" />
          <p className="font-mono text-sm text-[#b9cacb]">Loading cost controls...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0c10]">
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-[#b9cacb] hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="font-heading text-4xl font-bold text-white">AI Cost Controls</h1>
              <p className="font-mono text-sm text-[#b9cacb]">Configure AI usage limits and parameters</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-[#00f0ff] text-black font-bold uppercase tracking-wider font-mono px-6 py-2 rounded hover:bg-white transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mb-6 border border-red-500/50 bg-red-500/10 p-4 rounded-xl flex items-center gap-3">
            <Shield className="h-5 w-5 text-red-400" />
            <p className="font-mono text-sm text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 border border-emerald-500/50 bg-emerald-500/10 p-4 rounded-xl flex items-center gap-3">
            <Shield className="h-5 w-5 text-emerald-400" />
            <p className="font-mono text-sm text-emerald-400">Cost controls saved successfully</p>
          </div>
        )}

        <div className="grid gap-6">
          {/* Enable/Disable */}
          <div className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="h-6 w-6 text-[#00f0ff]" />
                <div>
                  <h3 className="font-heading text-lg font-bold text-white">Enable Cost Controls</h3>
                  <p className="font-mono text-xs text-[#b9cacb]">Turn cost controls on or off</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={controls.enabled}
                  onChange={(e) => setControls({ ...controls, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#3b494b] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00f0ff]" />
              </label>
            </div>
          </div>

          {/* Token Limits */}
          <div className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="h-6 w-6 text-[#00f0ff]" />
              <div>
                <h3 className="font-heading text-lg font-bold text-white">Token Limits</h3>
                <p className="font-mono text-xs text-[#b9cacb]">Control token usage per request</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-xs text-[#b9cacb] mb-2">Max Tokens per Request</label>
                <input
                  type="number"
                  value={controls.max_tokens}
                  onChange={(e) => setControls({ ...controls, max_tokens: parseInt(e.target.value) || 0 })}
                  disabled={!controls.enabled}
                  className="w-full bg-[#1f2229] border border-[#3b494b] rounded px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#00f0ff] disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block font-mono text-xs text-[#b9cacb] mb-2">Temperature (0-2)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={controls.temperature}
                  onChange={(e) => setControls({ ...controls, temperature: parseFloat(e.target.value) || 0 })}
                  disabled={!controls.enabled}
                  className="w-full bg-[#1f2229] border border-[#3b494b] rounded px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#00f0ff] disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Request Limits */}
          <div className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="h-6 w-6 text-[#00f0ff]" />
              <div>
                <h3 className="font-heading text-lg font-bold text-white">Request Limits</h3>
                <p className="font-mono text-xs text-[#b9cacb]">Limit the number of AI requests</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-xs text-[#b9cacb] mb-2">Daily Request Limit</label>
                <input
                  type="number"
                  value={controls.daily_request_limit}
                  onChange={(e) => setControls({ ...controls, daily_request_limit: parseInt(e.target.value) || 0 })}
                  disabled={!controls.enabled}
                  className="w-full bg-[#1f2229] border border-[#3b494b] rounded px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#00f0ff] disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block font-mono text-xs text-[#b9cacb] mb-2">Monthly Request Limit</label>
                <input
                  type="number"
                  value={controls.monthly_request_limit}
                  onChange={(e) => setControls({ ...controls, monthly_request_limit: parseInt(e.target.value) || 0 })}
                  disabled={!controls.enabled}
                  className="w-full bg-[#1f2229] border border-[#3b494b] rounded px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#00f0ff] disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Retry and Timeout */}
          <div className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="h-6 w-6 text-[#00f0ff]" />
              <div>
                <h3 className="font-heading text-lg font-bold text-white">Retry & Timeout Settings</h3>
                <p className="font-mono text-xs text-[#b9cacb]">Configure retry behavior and timeouts</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-xs text-[#b9cacb] mb-2">Max Retries</label>
                <input
                  type="number"
                  value={controls.max_retries}
                  onChange={(e) => setControls({ ...controls, max_retries: parseInt(e.target.value) || 0 })}
                  disabled={!controls.enabled}
                  className="w-full bg-[#1f2229] border border-[#3b494b] rounded px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#00f0ff] disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block font-mono text-xs text-[#b9cacb] mb-2">Request Timeout (ms)</label>
                <input
                  type="number"
                  value={controls.request_timeout_ms}
                  onChange={(e) => setControls({ ...controls, request_timeout_ms: parseInt(e.target.value) || 0 })}
                  disabled={!controls.enabled}
                  className="w-full bg-[#1f2229] border border-[#3b494b] rounded px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#00f0ff] disabled:opacity-50"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
