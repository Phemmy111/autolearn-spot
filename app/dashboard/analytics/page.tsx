'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { BookOpen, FileText, Trophy, Activity, Clock, TrendingUp } from 'lucide-react'

interface StudentProgressAnalytics {
  overallProgress: {
    percentage: number
    status: string
    estimatedCompletionDate: string | null
  }
  videoProgress: {
    completed: number
    total: number
    percentage: number
    averageWatchPct: number
  }
  assignmentProgress: {
    submitted: number
    total: number
    percentage: number
    averageScore: number
    onTimeRate: number
  }
  quizProgress: {
    completed: number
    total: number
    averageScore: number
    passRate: number
  }
  certificate: {
    eligible: boolean
    issued: boolean
    issuedAt: string | null
  }
  totalScore: number
}

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
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
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
        <Card className="border-destructive">
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
        <h1 className="text-3xl font-bold tracking-tight">Your Progress</h1>
        <p className="text-muted-foreground">
          Track your learning journey across videos, assignments, and quizzes
        </p>
      </div>

      {/* Overall Progress Card */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Overall Progress</CardTitle>
              <CardDescription>Your combined progress across all activities</CardDescription>
            </div>
            <Badge className={`${getStatusColor(analytics.overallProgress.status)} text-white`}>
              {getStatusLabel(analytics.overallProgress.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-4xl font-bold">{analytics.overallProgress.percentage}%</span>
            {analytics.overallProgress.estimatedCompletionDate && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="mr-2 h-4 w-4" />
                Est. completion: {new Date(analytics.overallProgress.estimatedCompletionDate).toLocaleDateString()}
              </div>
            )}
          </div>
          <Progress value={analytics.overallProgress.percentage} className="h-3" />
          {analytics.certificate.issued && (
            <div className="flex items-center text-sm text-green-600">
              <Trophy className="mr-2 h-4 w-4" />
              Certificate earned on {new Date(analytics.certificate.issuedAt!).toLocaleDateString()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Videos</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.videoProgress.completed}/{analytics.videoProgress.total}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.videoProgress.percentage}% complete
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.assignmentProgress.submitted}/{analytics.assignmentProgress.total}</div>
            <p className="text-xs text-muted-foreground">
              Avg score: {analytics.assignmentProgress.averageScore}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quizzes</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.quizProgress.completed}/{analytics.quizProgress.total}</div>
            <p className="text-xs text-muted-foreground">
              Pass rate: {analytics.quizProgress.passRate}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalScore}</div>
            <p className="text-xs text-muted-foreground">
              Leaderboard points
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="videos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="videos">Video Progress</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="videos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Video Learning Progress</CardTitle>
              <CardDescription>Your video watch completion and engagement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Completion</span>
                  <span className="font-medium">{analytics.videoProgress.percentage}%</span>
                </div>
                <Progress value={analytics.videoProgress.percentage} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Lessons Completed</p>
                  <p className="text-2xl font-bold">{analytics.videoProgress.completed}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Average Watch %</p>
                  <p className="text-2xl font-bold">{analytics.videoProgress.averageWatchPct}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assignment Performance</CardTitle>
              <CardDescription>Your assignment submissions and scores</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Submission Rate</span>
                  <span className="font-medium">{analytics.assignmentProgress.percentage}%</span>
                </div>
                <Progress value={analytics.assignmentProgress.percentage} />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Average Score</p>
                  <p className="text-2xl font-bold">{analytics.assignmentProgress.averageScore}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">On-Time Rate</p>
                  <p className="text-2xl font-bold">{analytics.assignmentProgress.onTimeRate}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                  <p className="text-2xl font-bold">{analytics.assignmentProgress.pendingReview}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quizzes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quiz Performance</CardTitle>
              <CardDescription>Your quiz attempts and scores</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Completion</span>
                  <span className="font-medium">{analytics.quizProgress.percentage}%</span>
                </div>
                <Progress value={analytics.quizProgress.percentage} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Average Score</p>
                  <p className="text-2xl font-bold">{analytics.quizProgress.averageScore}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Pass Rate</p>
                  <p className="text-2xl font-bold">{analytics.quizProgress.passRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your recent learning activities and logins</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Activity timeline will be displayed here. This feature tracks your login history and learning sessions.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
