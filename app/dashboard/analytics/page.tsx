'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { BookOpen, FileText, Trophy, Activity, Clock, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react'
import type { StudentProgressAnalytics } from '@/lib/analytics/types'

export default function StudentAnalyticsPage() {
  const [analytics, setAnalytics] = useState<StudentProgressAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/analytics/student/progress')
      if (!response.ok) throw new Error('Failed to fetch analytics')
      const data = await response.json()
      setAnalytics(data.analytics)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 bg-[#1f2229]" />
          <Skeleton className="h-4 w-96 bg-[#1f2229]" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
    )
  }

  if (error || !analytics) {
    return (
      <div className="container mx-auto py-8">
        <Card className="bg-[#0c0e12] border-destructive">
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
      case 'ahead': return 'bg-blue-500'
      case 'on_track': return 'bg-emerald-500'
      case 'behind': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed'
      case 'ahead': return 'Ahead of Schedule'
      case 'on_track': return 'On Track'
      case 'behind': return 'Behind Schedule'
      default: return status
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">Your Progress</h1>
        <p className="text-[#b9cacb]">
          Track your learning journey across videos, assignments, and quizzes
        </p>
      </div>

      {/* Overall Progress Card */}
      <Card className="bg-[#0c0e12] border-[#1f2229] border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-white">Overall Progress</CardTitle>
              <CardDescription className="text-[#b9cacb]">Your combined progress across all activities</CardDescription>
            </div>
            <Badge className={`${getStatusColor(analytics.overallProgress.status)} text-white`}>
              {getStatusLabel(analytics.overallProgress.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-4xl font-bold text-white">{analytics.overallProgress.percentage}%</span>
            {analytics.overallProgress.estimatedCompletionDate && (
              <div className="flex items-center text-sm text-[#b9cacb]">
                <Clock className="mr-2 h-4 w-4" />
                Est. completion: {new Date(analytics.overallProgress.estimatedCompletionDate).toLocaleDateString()}
              </div>
            )}
          </div>
          <Progress value={analytics.overallProgress.percentage} className="h-3" />
          
          {/* Progress Breakdown Chart */}
          <div className="space-y-3 pt-4 border-t border-[#1f2229]">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#b9cacb]">Videos</span>
                <span className="text-white font-semibold">{analytics.videoProgress.percentage}%</span>
              </div>
              <div className="h-2 bg-[#1f2229] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#00f0ff] transition-all duration-500" 
                  style={{ width: `${analytics.videoProgress.percentage}%` }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#b9cacb]">Assignments</span>
                <span className="text-white font-semibold">{analytics.assignmentProgress.percentage}%</span>
              </div>
              <div className="h-2 bg-[#1f2229] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 transition-all duration-500" 
                  style={{ width: `${analytics.assignmentProgress.percentage}%` }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#b9cacb]">Quizzes</span>
                <span className="text-white font-semibold">{analytics.quizProgress.percentage}%</span>
              </div>
              <div className="h-2 bg-[#1f2229] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500" 
                  style={{ width: `${analytics.quizProgress.percentage}%` }}
                />
              </div>
            </div>
          </div>
          
          {analytics.certificate.issued && analytics.certificate.eligible && analytics.overallProgress.percentage >= 100 && (
            <div className="flex items-center text-sm text-emerald-400">
              <Trophy className="mr-2 h-4 w-4" />
              Certificate earned on {new Date(analytics.certificate.issuedAt!).toLocaleDateString()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-[#0c0e12] border-[#1f2229]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Videos</CardTitle>
            <BookOpen className="h-4 w-4 text-[#00f0ff]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{analytics.videoProgress.completed}/{analytics.videoProgress.total}</div>
            <p className="text-xs text-[#b9cacb]">
              {analytics.videoProgress.percentage}% complete
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#0c0e12] border-[#1f2229]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Assignments</CardTitle>
            <FileText className="h-4 w-4 text-[#00f0ff]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{analytics.assignmentProgress.submitted}/{analytics.assignmentProgress.total}</div>
            <p className="text-xs text-[#b9cacb]">
              Avg score: {analytics.assignmentProgress.averageScore}%
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#0c0e12] border-[#1f2229]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Quizzes</CardTitle>
            <Trophy className="h-4 w-4 text-[#00f0ff]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{analytics.quizProgress.completed}/{analytics.quizProgress.total}</div>
            <p className="text-xs text-[#b9cacb]">
              Pass rate: {analytics.quizProgress.passRate}%
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#0c0e12] border-[#1f2229]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-[#00f0ff]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{analytics.totalScore}</div>
            <p className="text-xs text-[#b9cacb]">
              Leaderboard points
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="videos" className="space-y-4">
        <TabsList className="bg-[#111317] border-[#1f2229]">
          <TabsTrigger value="videos" className="data-[state=active]:bg-[#00f0ff] data-[state=active]:text-black">Video Progress</TabsTrigger>
          <TabsTrigger value="assignments" className="data-[state=active]:bg-[#00f0ff] data-[state=active]:text-black">Assignments</TabsTrigger>
          <TabsTrigger value="quizzes" className="data-[state=active]:bg-[#00f0ff] data-[state=active]:text-black">Quizzes</TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-[#00f0ff] data-[state=active]:text-black">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="videos" className="space-y-4">
          <Card className="bg-[#0c0e12] border-[#1f2229]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#00f0ff]" />
                Video Learning Progress
              </CardTitle>
              <CardDescription className="text-[#b9cacb]">Your video watch completion and engagement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 bg-[#1f2229] rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-[#b9cacb]">Overall Completion</span>
                  <span className="text-3xl font-bold text-[#00f0ff]">{analytics.videoProgress.percentage}%</span>
                </div>
                <Progress value={analytics.videoProgress.percentage} className="h-4" />
                <p className="text-xs text-[#5d5f63] mt-2">{analytics.videoProgress.completed} of {analytics.videoProgress.total} lessons completed</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 bg-[#111317] rounded-lg border border-[#1f2229]">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-[#00f0ff]" />
                    <p className="text-sm text-[#b9cacb]">Lessons Completed</p>
                  </div>
                  <p className="text-3xl font-bold text-white">{analytics.videoProgress.completed}</p>
                  <p className="text-xs text-[#5d5f63] mt-1">out of {analytics.videoProgress.total} total</p>
                </div>
                <div className="p-4 bg-[#111317] rounded-lg border border-[#1f2229]">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-[#00f0ff]" />
                    <p className="text-sm text-[#b9cacb]">Average Watch %</p>
                  </div>
                  <p className="text-3xl font-bold text-white">{analytics.videoProgress.averageWatchPct}%</p>
                  <p className="text-xs text-[#5d5f63] mt-1">engagement rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <Card className="bg-[#0c0e12] border-[#1f2229]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#00f0ff]" />
                Assignment Performance
              </CardTitle>
              <CardDescription className="text-[#b9cacb]">Your assignment submissions and scores</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 bg-[#1f2229] rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-[#b9cacb]">Submission Rate</span>
                  <span className="text-3xl font-bold text-[#00f0ff]">{analytics.assignmentProgress.percentage}%</span>
                </div>
                <Progress value={analytics.assignmentProgress.percentage} className="h-4" />
                <p className="text-xs text-[#5d5f63] mt-2">{analytics.assignmentProgress.submitted} of {analytics.assignmentProgress.total} assignments submitted</p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 bg-[#111317] rounded-lg border border-[#1f2229]">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="h-4 w-4 text-[#00f0ff]" />
                    <p className="text-sm text-[#b9cacb]">Average Score</p>
                  </div>
                  <p className="text-3xl font-bold text-white">{analytics.assignmentProgress.averageScore}%</p>
                  <p className="text-xs text-[#5d5f63] mt-1">performance</p>
                </div>
                <div className="p-4 bg-[#111317] rounded-lg border border-[#1f2229]">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-[#00f0ff]" />
                    <p className="text-sm text-[#b9cacb]">On-Time Rate</p>
                  </div>
                  <p className="text-3xl font-bold text-white">{analytics.assignmentProgress.onTimeRate}%</p>
                  <p className="text-xs text-[#5d5f63] mt-1">punctuality</p>
                </div>
                <div className="p-4 bg-[#111317] rounded-lg border border-[#1f2229]">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-[#00f0ff]" />
                    <p className="text-sm text-[#b9cacb]">Pending Review</p>
                  </div>
                  <p className="text-3xl font-bold text-white">{analytics.assignmentProgress.pendingReview}</p>
                  <p className="text-xs text-[#5d5f63] mt-1">awaiting feedback</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <p className="text-sm text-[#b9cacb]">Approved</p>
                  </div>
                  <p className="text-2xl font-bold text-green-400">{analytics.assignmentProgress.approved}</p>
                </div>
                <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-orange-400" />
                    <p className="text-sm text-[#b9cacb]">Needs Revision</p>
                  </div>
                  <p className="text-2xl font-bold text-orange-400">{analytics.assignmentProgress.needsRevision}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quizzes" className="space-y-4">
          <Card className="bg-[#0c0e12] border-[#1f2229]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Trophy className="h-5 w-5 text-[#00f0ff]" />
                Quiz Performance
              </CardTitle>
              <CardDescription className="text-[#b9cacb]">Your quiz attempts and scores</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 bg-[#1f2229] rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-[#b9cacb]">Quiz Completion</span>
                  <span className="text-3xl font-bold text-[#00f0ff]">{analytics.quizProgress.percentage}%</span>
                </div>
                <Progress value={analytics.quizProgress.percentage} className="h-4" />
                <p className="text-xs text-[#5d5f63] mt-2">{analytics.quizProgress.completed} of {analytics.quizProgress.total} quizzes completed</p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 bg-[#111317] rounded-lg border border-[#1f2229]">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-[#00f0ff]" />
                    <p className="text-sm text-[#b9cacb]">Average Score</p>
                  </div>
                  <p className="text-3xl font-bold text-white">{analytics.quizProgress.averageScore}%</p>
                  <p className="text-xs text-[#5d5f63] mt-1">performance</p>
                </div>
                <div className="p-4 bg-[#111317] rounded-lg border border-[#1f2229]">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-[#00f0ff]" />
                    <p className="text-sm text-[#b9cacb]">Pass Rate</p>
                  </div>
                  <p className="text-3xl font-bold text-white">{analytics.quizProgress.passRate}%</p>
                  <p className="text-xs text-[#5d5f63] mt-1">success rate</p>
                </div>
                <div className="p-4 bg-[#111317] rounded-lg border border-[#1f2229]">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="h-4 w-4 text-[#00f0ff]" />
                    <p className="text-sm text-[#b9cacb]">Quizzes Passed</p>
                  </div>
                  <p className="text-3xl font-bold text-white">{analytics.quizProgress.passed}</p>
                  <p className="text-xs text-[#5d5f63] mt-1">completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card className="bg-[#0c0e12] border-[#1f2229]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-[#00f0ff]" />
                Recent Activity
              </CardTitle>
              <CardDescription className="text-[#b9cacb]">Your recent learning activities and engagement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {analytics.lastActivityAt ? (
                <div className="p-4 bg-[#1f2229] rounded-lg border border-[#1f2229]">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-[#00f0ff]" />
                    <div>
                      <p className="text-sm font-medium text-white">Last Activity</p>
                      <p className="text-xs text-[#b9cacb]">{new Date(analytics.lastActivityAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-[#1f2229] rounded-lg border border-[#1f2229]">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-400" />
                    <div>
                      <p className="text-sm font-medium text-white">No Recent Activity</p>
                      <p className="text-xs text-[#b9cacb]">Start learning to see your activity here</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 bg-[#111317] rounded-lg border border-[#1f2229]">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="h-4 w-4 text-[#00f0ff]" />
                    <p className="text-sm text-[#b9cacb]">Video Progress</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={analytics.videoProgress.percentage} className="flex-1 h-2" />
                    <span className="text-sm font-bold text-white">{analytics.videoProgress.percentage}%</span>
                  </div>
                </div>
                <div className="p-4 bg-[#111317] rounded-lg border border-[#1f2229]">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-[#00f0ff]" />
                    <p className="text-sm text-[#b9cacb]">Assignment Progress</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={analytics.assignmentProgress.percentage} className="flex-1 h-2" />
                    <span className="text-sm font-bold text-white">{analytics.assignmentProgress.percentage}%</span>
                  </div>
                </div>
                <div className="p-4 bg-[#111317] rounded-lg border border-[#1f2229]">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="h-4 w-4 text-[#00f0ff]" />
                    <p className="text-sm text-[#b9cacb]">Quiz Progress</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={analytics.quizProgress.percentage} className="flex-1 h-2" />
                    <span className="text-sm font-bold text-white">{analytics.quizProgress.percentage}%</span>
                  </div>
                </div>
                <div className="p-4 bg-[#111317] rounded-lg border border-[#1f2229]">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-[#00f0ff]" />
                    <p className="text-sm text-[#b9cacb]">Overall Progress</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={analytics.overallProgress.percentage} className="flex-1 h-2" />
                    <span className="text-sm font-bold text-white">{analytics.overallProgress.percentage}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
