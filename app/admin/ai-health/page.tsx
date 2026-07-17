'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Activity, 
  Bot, 
  Clock, 
  CheckCircle, 
  XCircle,
  Zap,
  TrendingUp,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'

interface AIHealthData {
  activeProvider: {
    id: string
    name: string
    provider_type: string
    default_model: string | null
  } | null
  activeModel: string | null
  lastSuccessfulRequest: string | null
  lastFailedRequest: string | null
  averageResponseTime: number
  providerStatus: Array<{
    id: string
    name: string
    type: string
    isDefault: boolean
    isActive: boolean
  }>
  totalRequestsToday: number
  successRate: number
  totalTokensToday: number
}

export default function AIHealthPage() {
  const router = useRouter()
  const [healthData, setHealthData] = useState<AIHealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHealthData = async () => {
    try {
      const res = await fetch('/api/admin/ai-health')
      if (!res.ok) {
        if (res.status === 403) {
          router.push('/admin')
          return
        }
        throw new Error('Failed to fetch health data')
      }
      const data = await res.json()
      setHealthData(data)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load health data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealthData()
    // Refresh every 30 seconds
    const interval = setInterval(fetchHealthData, 30000)
    return () => clearInterval(interval)
  }, [router])

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return 'Never'
    const date = new Date(timestamp)
    return date.toLocaleTimeString()
  }

  const formatResponseTime = (ms: number) => {
    if (ms === 0) return 'N/A'
    return `${ms}ms`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-[#00f0ff] animate-spin mx-auto mb-4" />
          <p className="font-mono text-sm text-[#b9cacb]">Loading AI health data...</p>
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
              <h1 className="font-heading text-4xl font-bold text-white">AI Health Dashboard</h1>
              <p className="font-mono text-sm text-[#b9cacb]">Monitor AI provider performance and usage</p>
            </div>
          </div>
          <button
            onClick={fetchHealthData}
            className="flex items-center gap-2 border border-[#3b494b] text-[#b9cacb] font-mono text-sm px-4 py-2 rounded hover:bg-[#1f2229] transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 border border-red-500/50 bg-red-500/10 p-4 rounded-xl flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <p className="font-mono text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Active Provider Status */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <Bot className="h-6 w-6 text-[#00f0ff]" />
              <h3 className="font-mono text-xs text-[#b9cacb] uppercase">Active Provider</h3>
            </div>
            <p className="font-heading text-xl font-bold text-white">
              {healthData?.activeProvider?.name || 'None configured'}
            </p>
            <p className="font-mono text-xs text-[#5d5f63] mt-1">
              {healthData?.activeProvider?.provider_type?.toUpperCase() || ''}
            </p>
          </div>

          <div className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="h-6 w-6 text-[#00f0ff]" />
              <h3 className="font-mono text-xs text-[#b9cacb] uppercase">Active Model</h3>
            </div>
            <p className="font-heading text-xl font-bold text-white">
              {healthData?.activeModel || 'Not set'}
            </p>
          </div>

          <div className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="h-6 w-6 text-emerald-400" />
              <h3 className="font-mono text-xs text-[#b9cacb] uppercase">Last Success</h3>
            </div>
            <p className="font-heading text-xl font-bold text-white">
              {formatTime(healthData?.lastSuccessfulRequest || null)}
            </p>
          </div>

          <div className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <XCircle className="h-6 w-6 text-red-400" />
              <h3 className="font-mono text-xs text-[#b9cacb] uppercase">Last Failure</h3>
            </div>
            <p className="font-heading text-xl font-bold text-white">
              {formatTime(healthData?.lastFailedRequest || null)}
            </p>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="h-6 w-6 text-[#00f0ff]" />
              <h3 className="font-mono text-xs text-[#b9cacb] uppercase">Avg Response Time</h3>
            </div>
            <p className="font-heading text-3xl font-bold text-white">
              {formatResponseTime(healthData?.averageResponseTime || 0)}
            </p>
          </div>

          <div className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="h-6 w-6 text-emerald-400" />
              <h3 className="font-mono text-xs text-[#b9cacb] uppercase">Success Rate</h3>
            </div>
            <p className="font-heading text-3xl font-bold text-white">
              {healthData?.successRate || 0}%
            </p>
          </div>

          <div className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="h-6 w-6 text-[#00f0ff]" />
              <h3 className="font-mono text-xs text-[#b9cacb] uppercase">Requests Today</h3>
            </div>
            <p className="font-heading text-3xl font-bold text-white">
              {healthData?.totalRequestsToday || 0}
            </p>
          </div>
        </div>

        {/* Provider Status */}
        <div className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl">
          <h3 className="font-heading text-lg font-bold text-white mb-4">Provider Status</h3>
          <div className="space-y-3">
            {healthData?.providerStatus?.map((provider) => (
              <div
                key={provider.id}
                className="flex items-center justify-between p-4 bg-[#1f2229] rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    provider.isActive ? 'bg-emerald-400' : 'bg-red-400'
                  }`} />
                  <div>
                    <p className="font-mono text-sm text-white">{provider.name}</p>
                    <p className="font-mono text-xs text-[#5d5f63]">{provider.type.toUpperCase()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {provider.isDefault && (
                    <span className="px-2 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/50 text-xs font-mono text-yellow-400">
                      Default
                    </span>
                  )}
                  <span className={`px-2 py-1 rounded-full text-xs font-mono ${
                    provider.isActive
                      ? 'bg-emerald-400/10 border border-emerald-400/50 text-emerald-400'
                      : 'bg-red-400/10 border border-red-400/50 text-red-400'
                  }`}>
                    {provider.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Token Usage */}
        <div className="mt-8 border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl">
          <h3 className="font-heading text-lg font-bold text-white mb-4">Token Usage Today</h3>
          <p className="font-heading text-3xl font-bold text-white">
            {healthData?.totalTokensToday?.toLocaleString() || 0}
          </p>
          <p className="font-mono text-xs text-[#5d5f63] mt-1">Total tokens used</p>
        </div>
      </div>
    </div>
  )
}
