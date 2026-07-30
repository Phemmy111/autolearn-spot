'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, TrendingUp, Activity, Award, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface CohortAnalytics {
  cohortId: string
  totalStudents: number
  activeStudents: number
  engagementMetrics: {
    activeStudents7d: number
    activeStudents30d: number
    averageSessionDuration: number
    averageLoginFrequency: number
    courseCompletionRate: number
  }
  performanceDistribution: {
    scoreRanges: { range: string; count: number; percentage: number }[]
    averageScore: number
    medianScore: number
    topPerformers: { userId: string; userName: string; score: number }[]
    atRiskStudents: { userId: string; userName: string; progressPercentage: number; lastActivity: string }[]
  }
  averageProgress: number
  completionRate: number
}

interface StudentListEntry {
  userId: string
  userName: string
  email: string
  progressPercentage: number
  totalScore: number
  lastActivityAt: string
  status: 'active' | 'inactive' | 'completed'
}

export default function AdminProgressAnalyticsPage() {
  const [analytics, setAnalytics] = useState<CohortAnalytics | null>(null)
  const [students, setStudents] = useState<StudentListEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'progress' | 'score' | 'name' | 'activity'>('progress')

  useEffect(() => {
    fetchAnalytics()
    fetchStudents()
  }, [sortBy])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics/admin/cohort')
      if (!response.ok) throw new Error('Failed to fetch analytics')
      const data = await response.json()
      setAnalytics(data.analytics)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const fetchStudents = async () => {
    try {
      const response = await fetch(`/api/analytics/admin/students?sortBy=${sortBy}&sortOrder=desc`)
      if (!response.ok) throw new Error('Failed to fetch students')
      const data = await response.json()
      setStudents(data.students)
    } catch (err) {
      console.error('Failed to fetch students:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0c10]">
        <div className="container mx-auto px-4 py-12 max-w-7xl">
          <div className="space-y-2 mb-8">
            <Skeleton className="h-8 w-64 bg-[#1f2229]" />
            <Skeleton className="h-4 w-96 bg-[#1f2229]" />
          </div>
          <div className="grid gap-6 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="bg-[#0c0e12] border-[#1f2229]">
                <CardHeader>
                  <Skeleton className="h-4 w-24 bg-[#1f2229]" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 bg-[#1f2229]" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen bg-[#0a0c10]">
        <div className="container mx-auto px-4 py-12 max-w-7xl">
          <Card className="border-red-900 bg-[#0c0e12]">
            <CardContent className="pt-6">
              <p className="text-red-400">{error || 'Failed to load analytics'}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'active': return 'bg-blue-500'
      case 'inactive': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0c10]">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="mb-8">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-[#b9cacb] hover:text-white font-mono text-sm mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </Link>
          <h1 className="font-heading text-4xl font-bold text-white mb-4">Student Progress Analytics</h1>
          <p className="font-mono text-sm text-[#b9cacb]">Comprehensive cohort-wide progress tracking and performance metrics</p>
        </div>

        {/* Top Stats */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card className="bg-[#0c0e12] border-[#1f2229]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#b9cacb]">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{analytics.totalStudents}</div>
              <p className="text-xs text-[#5d5f63]">Enrolled in cohort</p>
            </CardContent>
          </Card>

          <Card className="bg-[#0c0e12] border-[#1f2229]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#b9cacb]">Active (7d)</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#00f0ff]">{analytics.activeStudents}</div>
              <p className="text-xs text-[#5d5f63]">
                {analytics.totalStudents > 0 
                  ? Math.round((analytics.activeStudents / analytics.totalStudents) * 100) 
                  : 0}% of total
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#0c0e12] border-[#1f2229]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#b9cacb]">Avg Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-400">{analytics.averageProgress}%</div>
              <p className="text-xs text-[#5d5f63]">Course completion</p>
            </CardContent>
          </Card>

          <Card className="bg-[#0c0e12] border-[#1f2229]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#b9cacb]">Completion Rate</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-400">{analytics.completionRate}%</div>
              <p className="text-xs text-[#5d5f63]">Certificate earned</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-[#0c0e12] border-[#1f2229]">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#1f2229]">Overview</TabsTrigger>
            <TabsTrigger value="students" className="data-[state=active]:bg-[#1f2229]">Students</TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-[#1f2229]">Performance</TabsTrigger>
            <TabsTrigger value="at-risk" className="data-[state=active]:bg-[#1f2229]">At-Risk</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card className="bg-[#0c0e12] border-[#1f2229]">
              <CardHeader>
                <CardTitle className="text-white">Engagement Metrics</CardTitle>
                <CardDescription className="text-[#b9cacb]">Student activity and engagement patterns</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-1">
                    <p className="text-sm text-[#5d5f63]">Active (7d)</p>
                    <p className="text-2xl font-bold text-white">{analytics.engagementMetrics.activeStudents7d}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-[#5d5f63]">Active (30d)</p>
                    <p className="text-2xl font-bold text-white">{analytics.engagementMetrics.activeStudents30d}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-[#5d5f63]">Avg Session</p>
                    <p className="text-2xl font-bold text-white">
                      {Math.round(analytics.engagementMetrics.averageSessionDuration / 60)}m
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-[#5d5f63]">Login Freq</p>
                    <p className="text-2xl font-bold text-white">
                      {analytics.engagementMetrics.averageLoginFrequency}/wk
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0c0e12] border-[#1f2229]">
              <CardHeader>
                <CardTitle className="text-white">Score Distribution</CardTitle>
                <CardDescription className="text-[#b9cacb]">Performance across all students</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {analytics.performanceDistribution.scoreRanges.map((range) => (
                    <div key={range.range} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#b9cacb]">{range.range}%</span>
                        <span className="text-white font-medium">{range.count} students ({range.percentage}%)</span>
                      </div>
                      <Progress value={range.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
                <div className="grid gap-4 md:grid-cols-2 pt-4">
                  <div className="space-y-1">
                    <p className="text-sm text-[#5d5f63]">Average Score</p>
                    <p className="text-xl font-bold text-white">{analytics.performanceDistribution.averageScore}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-[#5d5f63]">Median Score</p>
                    <p className="text-xl font-bold text-white">{analytics.performanceDistribution.medianScore}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="space-y-4">
            <Card className="bg-[#0c0e12] border-[#1f2229]">
              <CardHeader>
                <CardTitle className="text-white">Student List</CardTitle>
                <CardDescription className="text-[#b9cacb]">Sort by: {sortBy}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  {(['progress', 'score', 'name', 'activity'] as const).map((option) => (
                    <button
                      key={option}
                      onClick={() => setSortBy(option)}
                      className={`px-3 py-1 text-sm rounded ${
                        sortBy === option
                          ? 'bg-[#00f0ff] text-black font-bold'
                          : 'bg-[#1f2229] text-[#b9cacb] hover:bg-[#111317]'
                      }`}
                    >
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </button>
                  ))}
                </div>
                <div className="space-y-2">
                  {students.map((student) => (
                    <div
                      key={student.userId}
                      className="flex items-center justify-between p-3 rounded-lg bg-[#111317] border border-[#1f2229]"
                    >
                      <div className="flex items-center gap-3">
                        <Badge className={`${getStatusColor(student.status)} text-white`}>
                          {student.status}
                        </Badge>
                        <div>
                          <p className="text-sm font-medium text-white">{student.userName}</p>
                          <p className="text-xs text-[#5d5f63]">{student.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">{student.progressPercentage}%</p>
                        <p className="text-xs text-[#5d5f63]">Score: {student.totalScore}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card className="bg-[#0c0e12] border-[#1f2229]">
              <CardHeader>
                <CardTitle className="text-white">Top Performers</CardTitle>
                <CardDescription className="text-[#b9cacb]">Highest scoring students</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.performanceDistribution.topPerformers.map((student, index) => (
                    <div
                      key={student.userId}
                      className="flex items-center justify-between p-3 rounded-lg bg-[#111317] border border-[#1f2229]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#00f0ff] flex items-center justify-center text-black font-bold">
                          {index + 1}
                        </div>
                        <p className="text-sm font-medium text-white">{student.userName}</p>
                      </div>
                      <p className="text-lg font-bold text-[#00f0ff]">{student.score}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="at-risk" className="space-y-4">
            <Card className="bg-[#0c0e12] border-[#1f2229]">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-400" />
                  At-Risk Students
                </CardTitle>
                <CardDescription className="text-[#b9cacb]">
                  Students with low progress and inactive for 7+ days
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.performanceDistribution.atRiskStudents.length === 0 ? (
                  <p className="text-sm text-[#b9cacb]">No at-risk students found</p>
                ) : (
                  <div className="space-y-2">
                    {analytics.performanceDistribution.atRiskStudents.map((student) => (
                      <div
                        key={student.userId}
                        className="flex items-center justify-between p-3 rounded-lg border border-orange-900/50 bg-orange-950/20"
                      >
                        <div>
                          <p className="text-sm font-medium text-white">{student.userName}</p>
                          <p className="text-xs text-[#5d5f63]">Last activity: {student.lastActivity}</p>
                        </div>
                        <Badge variant="destructive">{student.progressPercentage}%</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
