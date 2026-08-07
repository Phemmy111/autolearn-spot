'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, TrendingUp, Activity, Award, AlertTriangle, BarChart3, Clock, Target, Zap, CheckCircle } from 'lucide-react'
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
      <div className="container mx-auto py-8 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 bg-[border-[var(--border-default)]]" />
          <Skeleton className="h-4 w-96 bg-[border-[var(--border-default)]]" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-[bg-[var(--card)]] border-[border-[var(--border-default)]]">
              <CardHeader>
                <Skeleton className="h-4 w-24 bg-[border-[var(--border-default)]]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 bg-[border-[var(--border-default)]]" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="container mx-auto py-8">
        <Card className="bg-[bg-[var(--card)]] border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error || 'Failed to load analytics'}</p>
          </CardContent>
        </Card>
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
    <div className="min-h-screen bg-[bg-[var(--background)]]">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="mb-8">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-[text-[var(--text-muted)]] hover:text-[var(--text-primary)] font-mono text-sm mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </Link>
          <h1 className="font-heading text-4xl font-bold text-[var(--text-primary)] mb-4">Student Progress Analytics</h1>
          <p className="font-mono text-sm text-[text-[var(--text-muted)]]">Comprehensive cohort-wide progress tracking and performance metrics</p>
        </div>

        {/* Top Stats */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card className="bg-[bg-[var(--card)]] border-[border-[var(--border-default)]]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[text-[var(--text-muted)]]">Total Students</CardTitle>
              <Users className="h-4 w-4 text-[text-[var(--text-muted)]]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[var(--text-primary)]">{analytics.totalStudents}</div>
              <p className="text-xs text-[text-[var(--text-muted)]]">Enrolled in cohort</p>
            </CardContent>
          </Card>

          <Card className="bg-[bg-[var(--card)]] border-[border-[var(--border-default)]]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[text-[var(--text-muted)]]">Active (7d)</CardTitle>
              <Activity className="h-4 w-4 text-[text-[var(--text-muted)]]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[text-[var(--primary)]]">{analytics.activeStudents}</div>
              <p className="text-xs text-[text-[var(--text-muted)]]">
                {analytics.totalStudents > 0 
                  ? Math.round((analytics.activeStudents / analytics.totalStudents) * 100) 
                  : 0}% of total
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[bg-[var(--card)]] border-[border-[var(--border-default)]]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[text-[var(--text-muted)]]">Avg Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-[text-[var(--text-muted)]]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-400">{analytics.averageProgress}%</div>
              <p className="text-xs text-[text-[var(--text-muted)]]">Course completion</p>
            </CardContent>
          </Card>

          <Card className="bg-[bg-[var(--card)]] border-[border-[var(--border-default)]]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[text-[var(--text-muted)]]">Completion Rate</CardTitle>
              <Award className="h-4 w-4 text-[text-[var(--text-muted)]]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-400">{analytics.completionRate}%</div>
              <p className="text-xs text-[text-[var(--text-muted)]]">Certificate earned</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-[bg-[var(--card)]] border-[border-[var(--border-default)]]">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[border-[var(--border-default)]]">Overview</TabsTrigger>
            <TabsTrigger value="students" className="data-[state=active]:bg-[border-[var(--border-default)]]">Students</TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-[border-[var(--border-default)]]">Performance</TabsTrigger>
            <TabsTrigger value="at-risk" className="data-[state=active]:bg-[border-[var(--border-default)]]">At-Risk</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-[bg-[var(--card)]] border-[border-[var(--border-default)]]">
                <CardHeader>
                  <CardTitle className="text-[var(--text-primary)] flex items-center gap-2">
                    <Activity className="h-5 w-5 text-[text-[var(--primary)]]" />
                    Engagement Metrics
                  </CardTitle>
                  <CardDescription className="text-[text-[var(--text-muted)]]">Student activity and engagement patterns</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 bg-[border-[var(--border-default)]] rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-[text-[var(--text-muted)]]">Active (7d)</p>
                        <Clock className="h-4 w-4 text-[text-[var(--primary)]]" />
                      </div>
                      <p className="text-3xl font-bold text-[var(--text-primary)]">{analytics.engagementMetrics.activeStudents7d}</p>
                      <Progress value={(analytics.engagementMetrics.activeStudents7d / analytics.totalStudents) * 100} className="h-2 mt-2" />
                    </div>
                    <div className="p-4 bg-[border-[var(--border-default)]] rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-[text-[var(--text-muted)]]">Active (30d)</p>
                        <Target className="h-4 w-4 text-[text-[var(--primary)]]" />
                      </div>
                      <p className="text-3xl font-bold text-[var(--text-primary)]">{analytics.engagementMetrics.activeStudents30d}</p>
                      <Progress value={(analytics.engagementMetrics.activeStudents30d / analytics.totalStudents) * 100} className="h-2 mt-2" />
                    </div>
                    <div className="p-4 bg-[border-[var(--border-default)]] rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-[text-[var(--text-muted)]]">Avg Session</p>
                        <Zap className="h-4 w-4 text-[text-[var(--primary)]]" />
                      </div>
                      <p className="text-3xl font-bold text-[var(--text-primary)]">
                        {Math.round(analytics.engagementMetrics.averageSessionDuration / 60)}m
                      </p>
                      <p className="text-xs text-[text-[var(--text-muted)]] mt-1">Average duration</p>
                    </div>
                    <div className="p-4 bg-[border-[var(--border-default)]] rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-[text-[var(--text-muted)]]">Login Freq</p>
                        <TrendingUp className="h-4 w-4 text-[text-[var(--primary)]]" />
                      </div>
                      <p className="text-3xl font-bold text-[var(--text-primary)]">
                        {analytics.engagementMetrics.averageLoginFrequency}/wk
                      </p>
                      <p className="text-xs text-[text-[var(--text-muted)]] mt-1">Per student</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[bg-[var(--card)]] border-[border-[var(--border-default)]]">
                <CardHeader>
                  <CardTitle className="text-[var(--text-primary)] flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-[text-[var(--primary)]]" />
                    Performance Distribution
                  </CardTitle>
                  <CardDescription className="text-[text-[var(--text-muted)]]">Score ranges and student performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {analytics.performanceDistribution.scoreRanges.map((range) => (
                      <div key={range.range} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-[text-[var(--text-muted)]]">{range.range}</span>
                          <span className="text-[var(--text-primary)] font-medium">{range.count} students ({range.percentage}%)</span>
                        </div>
                        <Progress value={range.percentage} className="h-3" />
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 border-t border-[border-[var(--border-default)]] grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-[text-[var(--text-muted)]]">Average Score</p>
                      <p className="text-2xl font-bold text-[text-[var(--primary)]]">{analytics.performanceDistribution.averageScore}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-[text-[var(--text-muted)]]">Median Score</p>
                      <p className="text-2xl font-bold text-[text-[var(--primary)]]">{analytics.performanceDistribution.medianScore}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-[bg-[var(--card)]] border-[border-[var(--border-default)]]">
              <CardHeader>
                <CardTitle className="text-[var(--text-primary)] flex items-center gap-2">
                  <Award className="h-5 w-5 text-[text-[var(--primary)]]" />
                  Top Performers
                </CardTitle>
                <CardDescription className="text-[text-[var(--text-muted)]]">Highest scoring students in the cohort</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.performanceDistribution.topPerformers.slice(0, 5).map((performer, index) => (
                    <div key={performer.userId} className="flex items-center justify-between p-3 bg-[border-[var(--border-default)]] rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[var(--text-primary)] ${
                          index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-[text-[var(--primary)]]'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-[var(--text-primary)]">{performer.userName}</p>
                          <p className="text-xs text-[text-[var(--text-muted)]]">Top performer</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-[text-[var(--primary)]]">{performer.score}%</p>
                        <p className="text-xs text-[text-[var(--text-muted)]]">Average score</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="space-y-4">
            <Card className="bg-[bg-[var(--card)]] border-[border-[var(--border-default)]]">
              <CardHeader>
                <CardTitle className="text-[var(--text-primary)] flex items-center gap-2">
                  <Users className="h-5 w-5 text-[text-[var(--primary)]]" />
                  Student Directory
                </CardTitle>
                <CardDescription className="text-[text-[var(--text-muted)]]">Sort and filter students by performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-6">
                  {(['progress', 'score', 'name', 'activity'] as const).map((option) => (
                    <button
                      key={option}
                      onClick={() => setSortBy(option)}
                      className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${
                        sortBy === option
                          ? 'bg-[text-[var(--primary)]] text-black shadow-lg shadow-[text-[var(--primary)]]/20'
                          : 'bg-[border-[var(--border-default)]] text-[text-[var(--text-muted)]] hover:bg-[bg-[var(--card)]] border border-[border-[var(--border-default)]]'
                      }`}
                    >
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </button>
                  ))}
                </div>
                <div className="space-y-3">
                  {students.map((student, index) => (
                    <div
                      key={student.userId}
                      className="group flex items-center justify-between p-4 rounded-lg bg-[bg-[var(--card)]] border border-[border-[var(--border-default)]] hover:border-[text-[var(--primary)]]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[text-[var(--primary)]]/5"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-[var(--text-primary)] ${
                          index < 3 ? 'bg-[text-[var(--primary)]]' : 'bg-[border-[var(--border-default)]]'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[text-[var(--primary)]] transition-colors">{student.userName}</p>
                          <p className="text-xs text-[text-[var(--text-muted)]]">{student.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-xs text-[text-[var(--text-muted)]] mb-1">Progress</p>
                          <div className="flex items-center gap-2">
                            <Progress value={student.progressPercentage} className="w-16 h-2" />
                            <span className="text-sm font-bold text-[var(--text-primary)]">{student.progressPercentage}%</span>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-[text-[var(--text-muted)]] mb-1">Score</p>
                          <p className="text-lg font-bold text-[text-[var(--primary)]]">{student.totalScore}</p>
                        </div>
                        <Badge className={`${getStatusColor(student.status)} text-[var(--text-primary)]`}>
                          {student.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card className="bg-[bg-[var(--card)]] border-[border-[var(--border-default)]]">
              <CardHeader>
                <CardTitle className="text-[var(--text-primary)] flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[text-[var(--primary)]]" />
                  Top Performers
                </CardTitle>
                <CardDescription className="text-[text-[var(--text-muted)]]">Highest scoring students in the cohort</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.performanceDistribution.topPerformers.map((student, index) => (
                    <div
                      key={student.userId}
                      className={`group flex items-center justify-between p-4 rounded-lg border transition-all duration-300 hover:shadow-lg ${
                        index === 0 
                          ? 'bg-yellow-500/10 border-yellow-500/30' 
                          : index === 1 
                          ? 'bg-gray-400/10 border-gray-400/30' 
                          : index === 2 
                          ? 'bg-amber-600/10 border-amber-600/30' 
                          : 'bg-[bg-[var(--card)]] border-[border-[var(--border-default)]] hover:border-[text-[var(--primary)]]/30'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-black font-bold text-lg ${
                          index === 0 
                            ? 'bg-yellow-500' 
                            : index === 1 
                            ? 'bg-gray-400' 
                            : index === 2 
                            ? 'bg-amber-600' 
                            : 'bg-[text-[var(--primary)]]'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-base font-semibold text-[var(--text-primary)] group-hover:text-[text-[var(--primary)]] transition-colors">{student.userName}</p>
                          <p className="text-xs text-[text-[var(--text-muted)]]">Top performer</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-[text-[var(--primary)]]">{student.score}%</p>
                        <p className="text-xs text-[text-[var(--text-muted)]]">Average score</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="at-risk" className="space-y-4">
            <Card className="bg-[bg-[var(--card)]] border-[border-[var(--border-default)]] border-orange-500/30">
              <CardHeader>
                <CardTitle className="text-[var(--text-primary)] flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-400" />
                  At-Risk Students
                </CardTitle>
                <CardDescription className="text-[text-[var(--text-muted)]]">
                  Students with low progress and inactive for 7+ days who may need intervention
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.performanceDistribution.atRiskStudents.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                    <p className="text-sm text-[text-[var(--text-muted)]]">No at-risk students found. All students are on track!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {analytics.performanceDistribution.atRiskStudents.map((student) => (
                      <div
                        key={student.userId}
                        className="flex items-center justify-between p-4 rounded-lg bg-orange-500/10 border border-orange-500/30"
                      >
                        <div className="flex items-center gap-4">
                          <AlertTriangle className="h-5 w-5 text-orange-400" />
                          <div>
                            <p className="text-sm font-semibold text-[var(--text-primary)]">{student.userName}</p>
                            <p className="text-xs text-[text-[var(--text-muted)]]">Last activity: {new Date(student.lastActivity).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-1">
                            <Progress value={student.progressPercentage} className="w-20 h-2" />
                            <span className="text-sm font-bold text-orange-400">{student.progressPercentage}%</span>
                          </div>
                          <p className="text-xs text-[text-[var(--text-muted)]]">Progress</p>
                        </div>
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
