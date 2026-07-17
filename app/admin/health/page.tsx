'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Activity, 
  Database, 
  Shield, 
  Zap, 
  Server, 
  Users, 
  FileText, 
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  ArrowLeft
} from 'lucide-react'

interface HealthCheck {
  status: 'healthy' | 'error' | 'degraded'
  message: string
}

interface HealthData {
  status: string
  checks: {
    database: HealthCheck
    clerk: HealthCheck
    openrouter: HealthCheck
    supabase: HealthCheck
    overall: HealthCheck
  }
  metrics: {
    totalQuizzes: number
    activeQuizzes: number
    totalStudents: number
    submissionsToday: number
    totalSubmissions: number
    averageScore: number
    passRate: number
    averageResponseTime: number
  }
  timestamp: string
}

export default function AdminHealthPage() {
  const router = useRouter()
  const [health, setHealth] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchHealth = async () => {
    try {
      setRefreshing(true)
      const res = await fetch('/api/admin/health')
      if (!res.ok) {
        if (res.status === 403) {
          router.push('/')
          return
        }
        throw new Error('Failed to fetch health status')
      }
      const data = await res.json()
      setHealth(data)
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to load health data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchHealth()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchHealth, 30000)
    return () => clearInterval(interval)
  }, [router])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-emerald-400" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-400" />
      case 'degraded':
        return <AlertCircle className="h-5 w-5 text-yellow-400" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-emerald-400'
      case 'error':
        return 'text-red-400'
      case 'degraded':
        return 'text-yellow-400'
      default:
        return 'text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-[#00f0ff] animate-spin mx-auto mb-4" />
          <p className="font-mono text-sm text-[#b9cacb]">Loading health data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
        <div className="text-center border border-red-500/50 bg-red-500/10 p-8 rounded-xl max-w-md">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="font-heading text-2xl font-bold text-white mb-2">Error</h2>
          <p className="font-mono text-sm text-[#b9cacb] mb-4">{error}</p>
          <button
            onClick={fetchHealth}
            className="flex items-center gap-2 mx-auto bg-[#00f0ff] text-black font-bold uppercase tracking-wider font-mono px-6 py-3 rounded hover:bg-white transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!health) return null

  return (
    <div className="min-h-screen bg-[#0a0c10]">
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-[#b9cacb] hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="font-heading text-4xl font-bold text-white">System Health</h1>
              <p className="font-mono text-sm text-[#b9cacb]">Monitor system status and metrics</p>
            </div>
          </div>
          <button
            onClick={fetchHealth}
            disabled={refreshing}
            className="flex items-center gap-2 bg-[#00f0ff]/10 text-[#00f0ff] font-bold uppercase tracking-wider font-mono px-6 py-2 rounded hover:bg-[#00f0ff]/20 transition-colors border border-[#00f0ff]/50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Overall Status */}
        <div className={`mb-8 border p-6 rounded-xl ${
          health.status === 'healthy' 
            ? 'border-emerald-500/50 bg-emerald-500/10' 
            : health.status === 'error'
            ? 'border-red-500/50 bg-red-500/10'
            : 'border-yellow-500/50 bg-yellow-500/10'
        }`}>
          <div className="flex items-center gap-4">
            {getStatusIcon(health.status)}
            <div>
              <h2 className={`font-heading text-2xl font-bold ${getStatusColor(health.status)}`}>
                {health.checks.overall.status.toUpperCase()}
              </h2>
              <p className="font-mono text-sm text-[#b9cacb]">{health.checks.overall.message}</p>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="mb-8">
          <h2 className="font-heading text-xl font-bold text-white mb-4">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border border-[#1f2229] bg-[#0c0e12] p-4 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <Database className="h-5 w-5 text-[#00f0ff]" />
                {getStatusIcon(health.checks.database.status)}
              </div>
              <h3 className="font-mono text-sm text-white font-bold">Database</h3>
              <p className="font-mono text-xs text-[#5d5f63] mt-1">{health.checks.database.message}</p>
            </div>

            <div className="border border-[#1f2229] bg-[#0c0e12] p-4 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <Shield className="h-5 w-5 text-[#00f0ff]" />
                {getStatusIcon(health.checks.clerk.status)}
              </div>
              <h3 className="font-mono text-sm text-white font-bold">Clerk Auth</h3>
              <p className="font-mono text-xs text-[#5d5f63] mt-1">{health.checks.clerk.message}</p>
            </div>

            <div className="border border-[#1f2229] bg-[#0c0e12] p-4 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <Zap className="h-5 w-5 text-[#00f0ff]" />
                {getStatusIcon(health.checks.openrouter.status)}
              </div>
              <h3 className="font-mono text-sm text-white font-bold">OpenRouter</h3>
              <p className="font-mono text-xs text-[#5d5f63] mt-1">{health.checks.openrouter.message}</p>
            </div>

            <div className="border border-[#1f2229] bg-[#0c0e12] p-4 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <Server className="h-5 w-5 text-[#00f0ff]" />
                {getStatusIcon(health.checks.supabase.status)}
              </div>
              <h3 className="font-mono text-sm text-white font-bold">Supabase</h3>
              <p className="font-mono text-xs text-[#5d5f63] mt-1">{health.checks.supabase.message}</p>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="mb-8">
          <h2 className="font-heading text-xl font-bold text-white mb-4">System Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="h-5 w-5 text-[#00f0ff]" />
                <span className="font-mono text-xs text-[#5d5f63] uppercase">Total Quizzes</span>
              </div>
              <p className="font-heading text-3xl font-bold text-white">{health.metrics.totalQuizzes}</p>
              <p className="font-mono text-xs text-[#5d5f63] mt-1">{health.metrics.activeQuizzes} active</p>
            </div>

            <div className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-5 w-5 text-[#00f0ff]" />
                <span className="font-mono text-xs text-[#5d5f63] uppercase">Total Students</span>
              </div>
              <p className="font-heading text-3xl font-bold text-white">{health.metrics.totalStudents}</p>
              <p className="font-mono text-xs text-[#5d5f63] mt-1">Registered users</p>
            </div>

            <div className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <Activity className="h-5 w-5 text-[#00f0ff]" />
                <span className="font-mono text-xs text-[#5d5f63] uppercase">Submissions Today</span>
              </div>
              <p className="font-heading text-3xl font-bold text-white">{health.metrics.submissionsToday}</p>
              <p className="font-mono text-xs text-[#5d5f63] mt-1">{health.metrics.totalSubmissions} total</p>
            </div>

            <div className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="h-5 w-5 text-[#00f0ff]" />
                <span className="font-mono text-xs text-[#5d5f63] uppercase">Avg Response Time</span>
              </div>
              <p className="font-heading text-3xl font-bold text-white">{health.metrics.averageResponseTime}ms</p>
              <p className="font-mono text-xs text-[#5d5f63] mt-1">API latency</p>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div>
          <h2 className="font-heading text-xl font-bold text-white mb-4">Performance Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-sm text-[#b9cacb]">Average Score</span>
                <span className="font-heading text-4xl font-bold text-[#00f0ff]">{health.metrics.averageScore}%</span>
              </div>
              <div className="w-full bg-[#1f2229] rounded-full h-2">
                <div 
                  className="bg-[#00f0ff] h-2 rounded-full transition-all"
                  style={{ width: `${health.metrics.averageScore}%` }}
                />
              </div>
            </div>

            <div className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-sm text-[#b9cacb]">Pass Rate</span>
                <span className="font-heading text-4xl font-bold text-emerald-400">{health.metrics.passRate}%</span>
              </div>
              <div className="w-full bg-[#1f2229] rounded-full h-2">
                <div 
                  className="bg-emerald-400 h-2 rounded-full transition-all"
                  style={{ width: `${health.metrics.passRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        <div className="mt-8 text-center">
          <p className="font-mono text-xs text-[#5d5f63]">
            Last updated: {new Date(health.timestamp).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  )
}
