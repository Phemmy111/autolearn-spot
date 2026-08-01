'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, RefreshCw, Trophy, BarChart3, Award, Verified, Trash2, RotateCcw, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface SystemStatus {
  activeCohorts: number
  totalStudents: number
  leaderboardEntries: number
  certificatesIssued: number
  badgesAwarded: number
  lastLeaderboardUpdate: string | null
  lastAnalyticsUpdate: string | null
}

interface Cohort {
  id: string
  name: string
  status: string
  is_current: boolean
}

interface MaintenanceResult {
  success: boolean
  message: string
  executionTimeMs?: number
  studentsProcessed?: number
  studentsSucceeded?: number
  studentsFailed?: number
  badgesAwarded?: number
  certificatesIssued?: number
  leaderboardEntriesUpdated?: number
  analyticsRecalculated?: number
  cacheCleared?: number
  results?: any[]
}

export default function MaintenancePage() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [cohorts, setCohorts] = useState<Cohort[]>([])
  const [selectedCohort, setSelectedCohort] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, MaintenanceResult>>({})
  const [confirmDialog, setConfirmDialog] = useState<string | null>(null)

  useEffect(() => {
    fetchStatus()
    fetchCohorts()
  }, [])

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/admin/maintenance/status')
      const data = await response.json()
      if (data.success) {
        setStatus(data.status)
      }
    } catch (error) {
      console.error('Failed to fetch status:', error)
    }
  }

  const fetchCohorts = async () => {
    try {
      const response = await fetch('/api/admin/maintenance/cohorts')
      const data = await response.json()
      if (data.success) {
        setCohorts(data.cohorts)
      }
    } catch (error) {
      console.error('Failed to fetch cohorts:', error)
    } finally {
      setLoading(false)
    }
  }

  const executeMaintenance = async (operation: string, endpoint: string, body: any = {}) => {
    setExecuting(operation)
    setConfirmDialog(null)
    setResults(prev => ({ ...prev, [operation]: null }))

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await response.json()
      
      setResults(prev => ({ ...prev, [operation]: data }))
      
      if (data.success) {
        // Refresh status after successful operation
        await fetchStatus()
      }
    } catch (error) {
      setResults(prev => ({ 
        ...prev, 
        [operation]: { success: false, message: 'Operation failed', error } 
      }))
    } finally {
      setExecuting(null)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleString()
  }

  const StatusCard = ({ title, value, icon: Icon }: { title: string; value: number | string; icon: any }) => (
    <div className="border border-[#1f2229] bg-[#0c0e12] p-4 rounded-xl">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-[#00f0ff]" />
        <div>
          <p className="font-mono text-xs text-[#b9cacb]">{title}</p>
          <p className="font-heading text-lg font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  )

  const MaintenanceSection = ({ 
    title, 
    description, 
    icon: Icon, 
    operation, 
    endpoint,
    result 
  }: { 
    title: string
    description: string
    icon: any
    operation: string
    endpoint: string
    result?: MaintenanceResult
  }) => (
    <div className="border border-[#1f2229] bg-[#0c0e12] p-6 rounded-xl">
      <div className="flex items-start gap-4 mb-4">
        <Icon className="h-6 w-6 text-[#00f0ff] mt-1" />
        <div className="flex-1">
          <h3 className="font-heading text-xl font-bold text-white mb-2">{title}</h3>
          <p className="font-mono text-xs text-[#b9cacb] mb-4">{description}</p>
          
          <button
            onClick={() => setConfirmDialog(operation)}
            disabled={executing !== null}
            className="bg-[#00f0ff] text-[#0a0c10] px-4 py-2 rounded-lg font-mono text-sm font-bold hover:bg-[#00f0ff]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {executing === operation ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                {title.split(' ')[0]}
              </>
            )}
          </button>
        </div>
      </div>

      {result && (
        <div className={`mt-4 p-4 rounded-lg border ${
          result.success 
            ? 'bg-green-500/10 border-green-500/30' 
            : 'bg-red-500/10 border-red-500/30'
        }`}>
          <div className="flex items-start gap-2">
            {result.success ? (
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`font-mono text-sm ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                {result.message}
              </p>
              {result.executionTimeMs && (
                <p className="font-mono text-xs text-[#b9cacb] mt-1">
                  Execution time: {result.executionTimeMs}ms
                </p>
              )}
              {result.studentsProcessed !== undefined && (
                <p className="font-mono text-xs text-[#b9cacb]">
                  Processed: {result.studentsProcessed} | Succeeded: {result.studentsSucceeded || 0} {result.studentsFailed ? `| Failed: ${result.studentsFailed}` : ''}
                </p>
              )}
              {result.certificatesIssued !== undefined && (
                <p className="font-mono text-xs text-[#b9cacb]">
                  Certificates issued: {result.certificatesIssued}
                </p>
              )}
              {result.badgesAwarded !== undefined && (
                <p className="font-mono text-xs text-[#b9cacb]">
                  Badges awarded: {result.badgesAwarded}
                </p>
              )}
              {result.analyticsRecalculated !== undefined && (
                <p className="font-mono text-xs text-[#b9cacb]">
                  Analytics recalculated: {result.analyticsRecalculated}
                </p>
              )}
              {result.leaderboardEntriesUpdated !== undefined && (
                <p className="font-mono text-xs text-[#b9cacb]">
                  Leaderboard updated: {result.leaderboardEntriesUpdated}
                </p>
              )}
              {result.cacheCleared !== undefined && (
                <p className="font-mono text-xs text-[#b9cacb]">
                  Cache entries cleared: {result.cacheCleared}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#00f0ff] animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0c10]">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-[#b9cacb] hover:text-white font-mono text-sm mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </Link>
          <h1 className="font-heading text-4xl font-bold text-white mb-4">System Maintenance</h1>
          <p className="font-mono text-sm text-[#b9cacb] max-w-2xl">
            Centralized maintenance operations for system health and data integrity
          </p>
        </div>

        {/* System Status Panel */}
        <div className="mb-8">
          <h2 className="font-heading text-2xl font-bold text-white mb-4">System Maintenance Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <StatusCard title="Active Cohorts" value={status?.activeCohorts || 0} icon={Trophy} />
            <StatusCard title="Total Students" value={status?.totalStudents || 0} icon={BarChart3} />
            <StatusCard title="Leaderboard Entries" value={status?.leaderboardEntries || 0} icon={Trophy} />
            <StatusCard title="Certificates Issued" value={status?.certificatesIssued || 0} icon={Verified} />
            <StatusCard title="Badges Awarded" value={status?.badgesAwarded || 0} icon={Award} />
            <StatusCard 
              title="Last Leaderboard Update" 
              value={formatDate(status?.lastLeaderboardUpdate || null)} 
              icon={RefreshCw} 
            />
          </div>
          <div className="mt-4 border border-[#1f2229] bg-[#0c0e12] p-4 rounded-xl">
            <p className="font-mono text-xs text-[#b9cacb]">
              Last Analytics Update: <span className="text-white">{formatDate(status?.lastAnalyticsUpdate || null)}</span>
            </p>
          </div>
        </div>

        {/* Cohort Selector */}
        <div className="mb-8 border border-[#1f2229] bg-[#0c0e12] p-4 rounded-xl">
          <label className="font-mono text-sm text-[#b9cacb] block mb-2">Target Cohort</label>
          <select
            value={selectedCohort}
            onChange={(e) => setSelectedCohort(e.target.value)}
            className="w-full bg-[#0a0c10] border border-[#1f2229] rounded-lg px-4 py-2 text-white font-mono text-sm focus:border-[#00f0ff] focus:outline-none"
          >
            <option value="all">All Active Cohorts</option>
            {cohorts.map(cohort => (
              <option key={cohort.id} value={cohort.id}>
                {cohort.name} {cohort.is_current ? '(Current)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Maintenance Operations */}
        <div className="grid md:grid-cols-2 gap-6">
          <MaintenanceSection
            title="Leaderboard Maintenance"
            description="Recalculate leaderboard scores using the existing scoring pipeline"
            icon={Trophy}
            operation="leaderboard"
            endpoint="/api/admin/leaderboard/backfill"
            result={results.leaderboard}
          />

          <MaintenanceSection
            title="Analytics Maintenance"
            description="Recalculate student analytics and progress metrics"
            icon={BarChart3}
            operation="analytics"
            endpoint="/api/admin/maintenance/analytics"
            result={results.analytics}
          />

          <MaintenanceSection
            title="Badge Maintenance"
            description="Recalculate and award badges based on student achievements"
            icon={Award}
            operation="badges"
            endpoint="/api/admin/maintenance/badges"
            result={results.badges}
          />

          <MaintenanceSection
            title="Certificate Maintenance"
            description="Issue certificates to eligible students who don't have one"
            icon={Verified}
            operation="certificates"
            endpoint="/api/admin/maintenance/certificates"
            result={results.certificates}
          />

          <MaintenanceSection
            title="Cache Maintenance"
            description="Clear analytics cache to force fresh data calculation"
            icon={Trash2}
            operation="cache-clear"
            endpoint="/api/admin/maintenance/cache"
            result={results['cache-clear']}
          />

          <MaintenanceSection
            title="Leaderboard Sync"
            description="Sync leaderboard for all students using triggerLeaderboardUpdate"
            icon={RotateCcw}
            operation="leaderboard-sync"
            endpoint="/api/admin/maintenance/leaderboard-sync"
            result={results['leaderboard-sync']}
          />
        </div>

        {/* Confirmation Dialog */}
        {confirmDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#0c0e12] border border-[#1f2229] rounded-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="h-6 w-6 text-yellow-500" />
                <h3 className="font-heading text-xl font-bold text-white">Confirm Maintenance Operation</h3>
              </div>
              <p className="font-mono text-sm text-[#b9cacb] mb-6">
                Are you sure you want to execute {confirmDialog}? This operation may take some time depending on the number of students.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="flex-1 border border-[#1f2229] bg-[#0c0e12] text-white px-4 py-2 rounded-lg font-mono text-sm hover:bg-[#1f2229] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    let cohortBody = selectedCohort === 'all' ? {} : { cohortId: selectedCohort }
                    let endpoint = confirmDialog === 'leaderboard' 
                      ? '/api/admin/leaderboard/backfill'
                      : confirmDialog === 'cache-clear'
                      ? '/api/admin/maintenance/cache'
                      : `/api/admin/maintenance/${confirmDialog === 'leaderboard-sync' ? 'leaderboard-sync' : confirmDialog}`
                    
                    // Special handling for cache clear - always send clearAll for "all cohorts" selection
                    if (confirmDialog === 'cache-clear') {
                      if (selectedCohort === 'all') {
                        cohortBody = { clearAll: true }
                      } else {
                        cohortBody = { cohortId: selectedCohort }
                      }
                    }
                    
                    executeMaintenance(confirmDialog, endpoint, cohortBody)
                  }}
                  className="flex-1 bg-[#00f0ff] text-[#0a0c10] px-4 py-2 rounded-lg font-mono text-sm font-bold hover:bg-[#00f0ff]/80 transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
