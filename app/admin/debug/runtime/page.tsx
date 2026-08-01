'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, AlertTriangle, CheckCircle, ArrowDown, Download } from 'lucide-react'

interface Student {
  clerk_user_id: string
  email: string
  full_name: string
  first_name: string
  last_name: string
  status: string
}

interface RuntimeData {
  userId: string
  cohortId: string
  timestamp: string
  warnings: any[]
  sections: {
    studentInfo: any
    assignmentRuntime: {
      databaseRows: any[]
      calculationStages: {
        input: any
        nullFilter: any
        mappedScores: any
        average: any
        functionOutput: any
      }
    }
    lessonRuntime: {
      databaseRows: any[]
      calculationStages: {
        input: any
        completedLessons: any
        completionRate: any
        functionOutput: any
      }
    }
    quizRuntime: {
      databaseRows: any[]
      calculationStages: {
        input: any
        bestScoreSelection: any
        average: any
        functionOutput: any
      }
    }
    overallProgress: {
      inputValues: any
      calculationStages: {
        weightedFormula: any
        functionOutput: any
      }
    }
    leaderboardRuntime: {
      calculationStages: {
        input: any
        assignmentContribution: number
        quizContribution: number
        videoContribution: number
        certificateBonus: number
        totalScore: number
        functionOutput: any
      }
    }
    leaderboardTable: any
    analyticsApiComparison?: {
      status: number
      ok: boolean
      data: any
    }
    leaderboardApiComparison?: {
      status: number
      ok: boolean
      data: any
    }
    pipelineVerification?: {
      stages: any[]
      failures: any[]
    }
    warnings: any[]
  }
}

export default function RuntimeDebugPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [runtimeData, setRuntimeData] = useState<RuntimeData | null>(null)
  const [loading, setLoading] = useState(false)
  const [studentsLoading, setStudentsLoading] = useState(true)

  useEffect(() => {
    loadStudents()
  }, [])

  const loadStudents = async () => {
    try {
      setStudentsLoading(true)
      const response = await fetch('/api/admin/debug/students')
      if (!response.ok) throw new Error('Failed to load students')
      const data = await response.json()
      setStudents(data.students || [])
    } catch (error) {
      console.error('Failed to load students:', error)
    } finally {
      setStudentsLoading(false)
    }
  }

  const loadRuntimeData = async () => {
    if (!selectedStudent) return

    try {
      setLoading(true)
      const response = await fetch(`/api/admin/debug/runtime?userId=${selectedStudent}`)
      if (!response.ok) throw new Error('Failed to load runtime data')
      const data = await response.json()
      // Only set runtimeData if successful and has sections
      if (data.success && data.runtime && data.runtime.sections) {
        setRuntimeData(data.runtime)
      } else {
        console.error('Runtime data incomplete:', data)
        setRuntimeData(null)
      }
    } catch (error) {
      console.error('Failed to load runtime data:', error)
      setRuntimeData(null)
    } finally {
      setLoading(false)
    }
  }

  const exportRuntimeReport = () => {
    if (!runtimeData || !runtimeData.sections) return
    
    const report = {
      metadata: {
        userId: runtimeData.userId,
        cohortId: runtimeData.cohortId,
        timestamp: runtimeData.timestamp,
        exportedAt: new Date().toISOString()
      },
      sections: runtimeData.sections,
      warnings: runtimeData.warnings,
      pipelineVerification: runtimeData.sections.pipelineVerification
    }
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `runtime-report-${runtimeData.userId}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const JsonDisplay = ({ data, title }: { data: any, title: string }) => (
    <div className="space-y-2">
      <h4 className="font-semibold text-sm text-[#b9cacb]">{title}</h4>
      <pre className="bg-[#0c0e12] p-3 rounded text-xs text-[#00f0ff] overflow-x-auto whitespace-pre-wrap">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )

  const StageDisplay = ({ stages }: { stages: any[] }) => (
    <div className="space-y-2">
      {stages.map((stage, index) => (
        <div key={index} className="flex items-center gap-2 text-xs font-mono">
          <span className="text-[#b9cacb]">{stage}</span>
          {index < stages.length - 1 && <ArrowDown className="w-3 h-3 text-[#5d5f63]" />}
        </div>
      ))}
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0c10] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Runtime Debug Dashboard</h1>
          <p className="text-[#b9cacb]">Complete runtime data pipeline trace</p>
        </div>

        {/* Student Selector */}
        <Card className="bg-[#0c0e12] border-[#1f2229]">
          <CardHeader>
            <CardTitle className="text-white">Select Student</CardTitle>
            <CardDescription className="text-[#b9cacb]">Choose a student to trace runtime data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-center">
              <select 
                value={selectedStudent} 
                onChange={(e) => setSelectedStudent(e.target.value)}
                disabled={studentsLoading}
                className="w-[400px] bg-[#111317] border border-[#1f2229] text-white p-2 rounded"
              >
                <option value="">Select a student...</option>
                {students.map((student) => (
                  <option key={student.clerk_user_id} value={student.clerk_user_id}>
                    {student.full_name || `${student.first_name} ${student.last_name}`} ({student.email})
                  </option>
                ))}
              </select>
              <Button 
                onClick={loadRuntimeData} 
                disabled={!selectedStudent || loading}
                className="bg-[#00f0ff] text-black hover:bg-[#00f0ff]/90"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Load Runtime Data'}
              </Button>
              {runtimeData && (
                <Button 
                  onClick={exportRuntimeReport}
                  variant="outline"
                  className="border-[#1f2229] text-white hover:bg-[#111317]"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Runtime Report
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {runtimeData && !runtimeData.sections && (
          <Card className="bg-[#0c0e12] border-[#1f2229]">
            <CardHeader>
              <CardTitle className="text-white">Error Loading Runtime Data</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#b9cacb]">Failed to load runtime data. Please check the console for details.</p>
            </CardContent>
          </Card>
        )}

        {runtimeData && runtimeData.sections && (
          <>
            {/* SECTION 1: Student Information */}
            <Card className="bg-[#0c0e12] border-[#1f2229]">
              <CardHeader>
                <CardTitle className="text-white">SECTION 1 — Student Information</CardTitle>
              </CardHeader>
              <CardContent>
                <JsonDisplay data={runtimeData.sections.studentInfo} title="Raw Enrollment Data" />
              </CardContent>
            </Card>

            {/* SECTION 2: Assignment Runtime Trace */}
            <Card className="bg-[#0c0e12] border-[#1f2229]">
              <CardHeader>
                <CardTitle className="text-white">SECTION 2 — Assignment Runtime Trace</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <JsonDisplay data={runtimeData.sections.assignmentRuntime.databaseRows} title="Database Rows (submissions)" />
                <div className="border-b border-[#1f2229] my-4" />
                <div className="grid grid-cols-2 gap-4">
                  <JsonDisplay data={runtimeData.sections.assignmentRuntime.calculationStages.input} title="INPUT" />
                  <JsonDisplay data={runtimeData.sections.assignmentRuntime.calculationStages.nullFilter} title="Null Filter" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <JsonDisplay data={runtimeData.sections.assignmentRuntime.calculationStages.mappedScores} title="Mapped Scores" />
                  <JsonDisplay data={runtimeData.sections.assignmentRuntime.calculationStages.average} title="Average" />
                </div>
                <JsonDisplay data={runtimeData.sections.assignmentRuntime.calculationStages.functionOutput} title="Return Object" />
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="bg-[#111317] p-3 rounded border border-[#1f2229]">
                    <div className="text-xs text-[#b9cacb]">Average Assignment Score</div>
                    <div className="text-2xl font-bold text-[#00f0ff]">
                      {runtimeData.sections.assignmentRuntime.calculationStages.functionOutput.averageScore}
                    </div>
                  </div>
                  <div className="bg-[#111317] p-3 rounded border border-[#1f2229]">
                    <div className="text-xs text-[#b9cacb]">Completed Assignments</div>
                    <div className="text-2xl font-bold text-[#00f0ff]">
                      {runtimeData.sections.assignmentRuntime.calculationStages.functionOutput.approved}
                    </div>
                  </div>
                  <div className="bg-[#111317] p-3 rounded border border-[#1f2229]">
                    <div className="text-xs text-[#b9cacb]">Assignment Progress</div>
                    <div className="text-2xl font-bold text-[#00f0ff]">
                      {runtimeData.sections.assignmentRuntime.calculationStages.functionOutput.percentage}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SECTION 3: Lesson Runtime Trace */}
            <Card className="bg-[#0c0e12] border-[#1f2229]">
              <CardHeader>
                <CardTitle className="text-white">SECTION 3 — Lesson Runtime Trace</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <JsonDisplay data={runtimeData.sections.lessonRuntime.databaseRows} title="Database Rows (lesson_progress)" />
                <div className="border-b border-[#1f2229] my-4" />
                <div className="grid grid-cols-2 gap-4">
                  <JsonDisplay data={runtimeData.sections.lessonRuntime.calculationStages.input} title="INPUT" />
                  <JsonDisplay data={runtimeData.sections.lessonRuntime.calculationStages.completedLessons} title="Completed Lessons" />
                </div>
                <JsonDisplay data={runtimeData.sections.lessonRuntime.calculationStages.completionRate} title="Completion Rate" />
                <JsonDisplay data={runtimeData.sections.lessonRuntime.calculationStages.functionOutput} title="Return Object" />
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-[#111317] p-3 rounded border border-[#1f2229]">
                    <div className="text-xs text-[#b9cacb]">Video Progress</div>
                    <div className="text-2xl font-bold text-[#00f0ff]">
                      {runtimeData.sections.lessonRuntime.calculationStages.functionOutput.percentage}%
                    </div>
                  </div>
                  <div className="bg-[#111317] p-3 rounded border border-[#1f2229]">
                    <div className="text-xs text-[#b9cacb]">Completed Lessons</div>
                    <div className="text-2xl font-bold text-[#00f0ff]">
                      {runtimeData.sections.lessonRuntime.calculationStages.completedLessons.count}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SECTION 4: Quiz Runtime Trace */}
            <Card className="bg-[#0c0e12] border-[#1f2229]">
              <CardHeader>
                <CardTitle className="text-white">SECTION 4 — Quiz Runtime Trace</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <JsonDisplay data={runtimeData.sections.quizRuntime.databaseRows} title="Database Rows (quiz_responses)" />
                <div className="border-b border-[#1f2229] my-4" />
                <div className="grid grid-cols-2 gap-4">
                  <JsonDisplay data={runtimeData.sections.quizRuntime.calculationStages.input} title="INPUT" />
                  <JsonDisplay data={runtimeData.sections.quizRuntime.calculationStages.bestScoreSelection} title="Best Score Selection" />
                </div>
                <JsonDisplay data={runtimeData.sections.quizRuntime.calculationStages.average} title="Average" />
                <JsonDisplay data={runtimeData.sections.quizRuntime.calculationStages.functionOutput} title="Return Object" />
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-[#111317] p-3 rounded border border-[#1f2229]">
                    <div className="text-xs text-[#b9cacb]">Quiz Progress</div>
                    <div className="text-2xl font-bold text-[#00f0ff]">
                      {runtimeData.sections.quizRuntime.calculationStages.functionOutput.percentage}%
                    </div>
                  </div>
                  <div className="bg-[#111317] p-3 rounded border border-[#1f2229]">
                    <div className="text-xs text-[#b9cacb]">Passed Quizzes</div>
                    <div className="text-2xl font-bold text-[#00f0ff]">
                      {runtimeData.sections.quizRuntime.calculationStages.functionOutput.passed}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SECTION 5: Overall Progress */}
            <Card className="bg-[#0c0e12] border-[#1f2229]">
              <CardHeader>
                <CardTitle className="text-white">SECTION 5 — Overall Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <JsonDisplay data={runtimeData.sections.overallProgress.inputValues} title="Input Values" />
                <div className="border-b border-[#1f2229] my-4" />
                <JsonDisplay data={runtimeData.sections.overallProgress.calculationStages.weightedFormula} title="Weighted Formula" />
                <JsonDisplay data={runtimeData.sections.overallProgress.calculationStages.functionOutput} title="Return Object" />
                <div className="bg-[#111317] p-3 rounded border border-[#1f2229] mt-4">
                  <div className="text-xs text-[#b9cacb]">Overall Progress</div>
                  <div className="text-2xl font-bold text-[#00f0ff]">
                    {runtimeData.sections.overallProgress.calculationStages.functionOutput.percentage}%
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SECTION 6: Leaderboard Runtime */}
            <Card className="bg-[#0c0e12] border-[#1f2229]">
              <CardHeader>
                <CardTitle className="text-white">SECTION 6 — Leaderboard Runtime</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <JsonDisplay data={runtimeData.sections.leaderboardRuntime.calculationStages.input} title="INPUT" />
                <div className="border-b border-[#1f2229] my-4" />
                <div className="grid grid-cols-5 gap-4">
                  <JsonDisplay data={runtimeData.sections.leaderboardRuntime.calculationStages.assignmentContribution} title="Assignment Contribution" />
                  <JsonDisplay data={runtimeData.sections.leaderboardRuntime.calculationStages.quizContribution} title="Quiz Contribution" />
                  <JsonDisplay data={runtimeData.sections.leaderboardRuntime.calculationStages.videoContribution} title="Video Contribution" />
                  <JsonDisplay data={runtimeData.sections.leaderboardRuntime.calculationStages.certificateBonus} title="Certificate Bonus" />
                  <JsonDisplay data={runtimeData.sections.leaderboardRuntime.calculationStages.totalScore} title="Total Score" />
                </div>
                <JsonDisplay data={runtimeData.sections.leaderboardRuntime.calculationStages.functionOutput} title="Return Object" />
              </CardContent>
            </Card>

            {/* SECTION 7: Leaderboard Database */}
            <Card className="bg-[#0c0e12] border-[#1f2229]">
              <CardHeader>
                <CardTitle className="text-white">SECTION 7 — Leaderboard Database</CardTitle>
              </CardHeader>
              <CardContent>
                <JsonDisplay data={runtimeData.sections.leaderboardTable} title="Database Entry" />
              </CardContent>
            </Card>

            {/* SECTION 8: Analytics API Comparison */}
            {runtimeData.sections.analyticsApiComparison && (
              <Card className="bg-[#0c0e12] border-[#1f2229]">
                <CardHeader>
                  <CardTitle className="text-white">SECTION 8 — Analytics API Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant={runtimeData.sections.analyticsApiComparison.ok ? "default" : "destructive"}>
                      Status: {runtimeData.sections.analyticsApiComparison.status}
                    </Badge>
                    <Badge variant={runtimeData.sections.analyticsApiComparison.ok ? "default" : "destructive"}>
                      {runtimeData.sections.analyticsApiComparison.ok ? "OK" : "FAILED"}
                    </Badge>
                  </div>
                  <JsonDisplay data={runtimeData.sections.analyticsApiComparison.data} title="Raw JSON from /api/analytics/student/progress" />
                </CardContent>
              </Card>
            )}

            {/* SECTION 9: Leaderboard API Comparison */}
            {runtimeData.sections.leaderboardApiComparison && (
              <Card className="bg-[#0c0e12] border-[#1f2229]">
                <CardHeader>
                  <CardTitle className="text-white">SECTION 9 — Leaderboard API Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant={runtimeData.sections.leaderboardApiComparison.ok ? "default" : "destructive"}>
                      Status: {runtimeData.sections.leaderboardApiComparison.status}
                    </Badge>
                    <Badge variant={runtimeData.sections.leaderboardApiComparison.ok ? "default" : "destructive"}>
                      {runtimeData.sections.leaderboardApiComparison.ok ? "OK" : "FAILED"}
                    </Badge>
                  </div>
                  {runtimeData.sections.leaderboardApiComparison.data?.leaderboard && (
                    <div className="mb-4">
                      <div className="text-sm text-[#b9cacb] mb-2">Student entry in leaderboard:</div>
                      <JsonDisplay 
                        data={runtimeData.sections.leaderboardApiComparison.data.leaderboard.find(
                            (entry: any) => entry.user_id === runtimeData.userId
                          ) || "Not found in leaderboard"} 
                        title="This student's leaderboard entry" 
                      />
                    </div>
                  )}
                  <JsonDisplay data={runtimeData.sections.leaderboardApiComparison.data} title="Raw JSON from /api/leaderboard" />
                </CardContent>
              </Card>
            )}

            {/* SECTION 10: Pipeline Verification */}
            {runtimeData.sections.pipelineVerification && (
              <Card className="bg-[#0c0e12] border-[#1f2229]">
                <CardHeader>
                  <CardTitle className="text-white">SECTION 10 — Pipeline Verification</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm text-[#b9cacb] mb-2">Pipeline Stages</h4>
                    <StageDisplay stages={runtimeData.sections.pipelineVerification.stages} />
                  </div>
                  {runtimeData.sections.pipelineVerification.failures && runtimeData.sections.pipelineVerification.failures.length > 0 && (
                    <>
                      <div className="border-b border-[#1f2229] my-4" />
                      <div>
                        <h4 className="font-semibold text-sm text-red-400 mb-2">Failures</h4>
                        <JsonDisplay data={runtimeData.sections.pipelineVerification.failures} title="Error Details" />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
