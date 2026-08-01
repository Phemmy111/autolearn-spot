'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loader2, AlertTriangle, CheckCircle, XCircle, ArrowDown, Download } from 'lucide-react'

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
    analyticsApi: {
      status: number
      ok: boolean
      data: any
    }
    leaderboardApi: {
      status: number
      ok: boolean
      data: any
    }
    pipelineVerification: {
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
      setRuntimeData(data)
    } catch (error) {
      console.error('Failed to load runtime data:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportRuntimeReport = () => {
    if (!runtimeData) return
    
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
              <Select value={selectedStudent} onValueChange={setSelectedStudent} disabled={studentsLoading}>
                <SelectTrigger className="w-[400px] bg-[#111317] border-[#1f2229] text-white">
                  <SelectValue placeholder="Select a student..." />
                </SelectTrigger>
                <SelectContent className="bg-[#111317] border-[#1f2229]">
                  {students.map((student) => (
                    <SelectItem key={student.clerk_user_id} value={student.clerk_user_id} className="text-white">
                      {student.full_name || `${student.first_name} ${student.last_name}`} ({student.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

        {runtimeData && (
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
                <Separator className="bg-[#1f2229]" />
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
                    <div className="text-xs text-[#b9cacb]">Assignment %</div>
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
                <Separator className="bg-[#1f2229]" />
                <div className="grid grid-cols-2 gap-4">
                  <JsonDisplay data={runtimeData.sections.lessonRuntime.calculationStages.input} title="INPUT" />
                  <JsonDisplay data={runtimeData.sections.lessonRuntime.calculationStages.completedLessons} title="Completed Lessons" />
                </div>
                <JsonDisplay data={runtimeData.sections.lessonRuntime.calculationStages.completionRate} title="Completion %" />
                <JsonDisplay data={runtimeData.sections.lessonRuntime.calculationStages.functionOutput} title="Return" />
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="bg-[#111317] p-3 rounded border border-[#1f2229]">
                    <div className="text-xs text-[#b9cacb]">Completed Lessons</div>
                    <div className="text-2xl font-bold text-[#00f0ff]">
                      {runtimeData.sections.lessonRuntime.calculationStages.functionOutput.completed}
                    </div>
                  </div>
                  <div className="bg-[#111317] p-3 rounded border border-[#1f2229]">
                    <div className="text-xs text-[#b9cacb]">Total Lessons</div>
                    <div className="text-2xl font-bold text-[#00f0ff]">
                      {runtimeData.sections.lessonRuntime.calculationStages.functionOutput.total}
                    </div>
                  </div>
                  <div className="bg-[#111317] p-3 rounded border border-[#1f2229]">
                    <div className="text-xs text-[#b9cacb]">Video %</div>
                    <div className="text-2xl font-bold text-[#00f0ff]">
                      {runtimeData.sections.lessonRuntime.calculationStages.functionOutput.percentage}%
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
                <Separator className="bg-[#1f2229]" />
                <div className="grid grid-cols-2 gap-4">
                  <JsonDisplay data={runtimeData.sections.quizRuntime.calculationStages.input} title="INPUT" />
                  <JsonDisplay data={runtimeData.sections.quizRuntime.calculationStages.bestScoreSelection} title="Best Score Selection" />
                </div>
                <JsonDisplay data={runtimeData.sections.quizRuntime.calculationStages.average} title="Average" />
                <JsonDisplay data={runtimeData.sections.quizRuntime.calculationStages.functionOutput} title="Return" />
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="bg-[#111317] p-3 rounded border border-[#1f2229]">
                    <div className="text-xs text-[#b9cacb]">Average Quiz Score</div>
                    <div className="text-2xl font-bold text-[#00f0ff]">
                      {runtimeData.sections.quizRuntime.calculationStages.functionOutput.averageScore}
                    </div>
                  </div>
                  <div className="bg-[#111317] p-3 rounded border border-[#1f2229]">
                    <div className="text-xs text-[#b9cacb]">Completed Quizzes</div>
                    <div className="text-2xl font-bold text-[#00f0ff]">
                      {runtimeData.sections.quizRuntime.calculationStages.functionOutput.completed}
                    </div>
                  </div>
                  <div className="bg-[#111317] p-3 rounded border border-[#1f2229]">
                    <div className="text-xs text-[#b9cacb]">Quiz %</div>
                    <div className="text-2xl font-bold text-[#00f0ff]">
                      {runtimeData.sections.quizRuntime.calculationStages.functionOutput.percentage}%
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
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[#111317] p-3 rounded border border-[#1f2229]">
                    <div className="text-xs text-[#b9cacb]">Video %</div>
                    <div className="text-2xl font-bold text-[#00f0ff]">
                      {runtimeData.sections.overallProgress.inputValues.videoPercentage}%
                    </div>
                  </div>
                  <div className="bg-[#111317] p-3 rounded border border-[#1f2229]">
                    <div className="text-xs text-[#b9cacb]">Assignment %</div>
                    <div className="text-2xl font-bold text-[#00f0ff]">
                      {runtimeData.sections.overallProgress.inputValues.assignmentPercentage}%
                    </div>
                  </div>
                  <div className="bg-[#111317] p-3 rounded border border-[#1f2229]">
                    <div className="text-xs text-[#b9cacb]">Quiz %</div>
                    <div className="text-2xl font-bold text-[#00f0ff]">
                      {runtimeData.sections.overallProgress.inputValues.quizPercentage}%
                    </div>
                  </div>
                </div>
                <Separator className="bg-[#1f2229]" />
                <JsonDisplay data={runtimeData.sections.overallProgress.calculationStages.weightedFormula} title="Weighted Formula" />
                <JsonDisplay data={runtimeData.sections.overallProgress.calculationStages.functionOutput} title="Return" />
                
                {/* Detailed Weighted Formula Display */}
                <div className="bg-[#111317] p-4 rounded border border-[#1f2229] space-y-2">
                  <div className="text-sm font-semibold text-white">Weighted Formula Steps:</div>
                  <div className="text-xs text-[#b9cacb] font-mono">
                    Video: {runtimeData.sections.overallProgress.calculationStages.weightedFormula.video.percentage} × {runtimeData.sections.overallProgress.calculationStages.weightedFormula.video.weight} = {runtimeData.sections.overallProgress.calculationStages.weightedFormula.video.contribution.toFixed(1)}
                  </div>
                  <div className="text-xs text-[#b9cacb] font-mono">
                    Assignment: {runtimeData.sections.overallProgress.calculationStages.weightedFormula.assignment.percentage} × {runtimeData.sections.overallProgress.calculationStages.weightedFormula.assignment.weight} = {runtimeData.sections.overallProgress.calculationStages.weightedFormula.assignment.contribution.toFixed(1)}
                  </div>
                  <div className="text-xs text-[#b9cacb] font-mono">
                    Quiz: {runtimeData.sections.overallProgress.calculationStages.weightedFormula.quiz.percentage} × {runtimeData.sections.overallProgress.calculationStages.weightedFormula.quiz.weight} = {runtimeData.sections.overallProgress.calculationStages.weightedFormula.quiz.contribution.toFixed(1)}
                  </div>
                  <Separator className="bg-[#1f2229]" />
                  <div className="text-sm font-bold text-[#00f0ff] font-mono">
                    Total: {runtimeData.sections.overallProgress.calculationStages.weightedFormula.total.toFixed(1)}
                  </div>
                  {Math.round(runtimeData.sections.overallProgress.calculationStages.weightedFormula.total) !== runtimeData.sections.overallProgress.calculationStages.functionOutput.percentage && (
                    <Badge variant="destructive" className="mt-2">Mismatch detected</Badge>
                  )}
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
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-[#111317] p-3 rounded border border-[#1f2229]">
                    <div className="text-xs text-[#b9cacb]">Assignment Contribution</div>
                    <div className="text-xl font-bold text-[#00f0ff]">
                      {runtimeData.sections.leaderboardRuntime.calculationStages.assignmentContribution}
                    </div>
                  </div>
                  <div className="bg-[#111317] p-3 rounded border border-[#1f2229]">
                    <div className="text-xs text-[#b9cacb]">Quiz Contribution</div>
                    <div className="text-xl font-bold text-[#00f0ff]">
                      {runtimeData.sections.leaderboardRuntime.calculationStages.quizContribution}
                    </div>
                  </div>
                  <div className="bg-[#111317] p-3 rounded border border-[#1f2229]">
                    <div className="text-xs text-[#b9cacb]">Video Contribution</div>
                    <div className="text-xl font-bold text-[#00f0ff]">
                      {runtimeData.sections.leaderboardRuntime.calculationStages.videoContribution}
                    </div>
                  </div>
                  <div className="bg-[#111317] p-3 rounded border border-[#1f2229]">
                    <div className="text-xs text-[#b9cacb]">Certificate Bonus</div>
                    <div className="text-xl font-bold text-[#00f0ff]">
                      {runtimeData.sections.leaderboardRuntime.calculationStages.certificateBonus}
                    </div>
                  </div>
                </div>
                <div className="bg-[#111317] p-3 rounded border border-[#1f2229]">
                  <div className="text-xs text-[#b9cacb]">Total Score</div>
                  <div className="text-2xl font-bold text-[#00f0ff]">
                    {runtimeData.sections.leaderboardRuntime.calculationStages.totalScore}
                  </div>
                </div>
                <JsonDisplay data={runtimeData.sections.leaderboardRuntime.calculationStages.functionOutput} title="Return" />
              </CardContent>
            </Card>

            {/* SECTION 7: Leaderboard Database */}
            <Card className="bg-[#0c0e12] border-[#1f2229]">
              <CardHeader>
                <CardTitle className="text-white">SECTION 7 — Leaderboard Database (Raw Row)</CardTitle>
              </CardHeader>
              <CardContent>
                {runtimeData.sections.leaderboardTable ? (
                  <JsonDisplay data={runtimeData.sections.leaderboardTable} title="leaderboard table row" />
                ) : (
                  <div className="text-[#b9cacb]">No leaderboard entry found for this student</div>
                )}
              </CardContent>
            </Card>

            {/* SECTION 8: Analytics API Comparison */}
            <Card className="bg-[#0c0e12] border-[#1f2229]">
              <CardHeader>
                <CardTitle className="text-white">SECTION 8 — Analytics API Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant={runtimeData.sections.analyticsApi.ok ? "default" : "destructive"}>
                    Status: {runtimeData.sections.analyticsApi.status}
                  </Badge>
                  <Badge variant={runtimeData.sections.analyticsApi.ok ? "default" : "destructive"}>
                    {runtimeData.sections.analyticsApi.ok ? "OK" : "FAILED"}
                  </Badge>
                </div>
                <JsonDisplay data={runtimeData.sections.analyticsApi.data} title="Raw JSON from /api/analytics/student/progress" />
              </CardContent>
            </Card>

            {/* SECTION 9: Leaderboard API Comparison */}
            <Card className="bg-[#0c0e12] border-[#1f2229]">
              <CardHeader>
                <CardTitle className="text-white">SECTION 9 — Leaderboard API Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant={runtimeData.sections.leaderboardApi.ok ? "default" : "destructive"}>
                    Status: {runtimeData.sections.leaderboardApi.status}
                  </Badge>
                  <Badge variant={runtimeData.sections.leaderboardApi.ok ? "default" : "destructive"}>
                    {runtimeData.sections.leaderboardApi.ok ? "OK" : "FAILED"}
                  </Badge>
                </div>
                {runtimeData.sections.leaderboardApi.data?.leaderboard && (
                  <div className="mb-4">
                    <div className="text-sm text-[#b9cacb] mb-2">Student entry in leaderboard:</div>
                    <JsonDisplay 
                      data={runtimeData.sections.leaderboardApi.data.leaderboard.find(
                        (entry: any) => entry.user_id === runtimeData.userId
                      ) || "Not found in leaderboard"} 
                      title="This student's leaderboard entry" 
                    />
                  </div>
                )}
                <JsonDisplay data={runtimeData.sections.leaderboardApi.data} title="Raw JSON from /api/leaderboard" />
              </CardContent>
            </Card>

            {/* SECTION 10: Pipeline Verification */}
            <Card className="bg-[#0c0e12] border-[#1f2229]">
              <CardHeader>
                <CardTitle className="text-white">SECTION 10 — Pipeline Verification</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {runtimeData.sections.pipelineVerification.failures.length > 0 ? (
                  <div className="space-y-3">
                    {runtimeData.sections.pipelineVerification.failures.map((failure, index) => (
                      <div key={index} className="bg-red-500/10 border border-red-500/30 p-4 rounded">
                        <div className="flex items-center gap-2 text-red-400 font-bold mb-2">
                          <AlertTriangle className="w-5 h-5" />
                          FAILURE DETECTED
                        </div>
                        <div className="space-y-1 text-sm">
                          <div><span className="text-[#b9cacb]">Pipeline:</span> {failure.pipeline}</div>
                          <div><span className="text-[#b9cacb]">From Stage:</span> {failure.fromStage}</div>
                          <div><span className="text-[#b9cacb]">To Stage:</span> {failure.toStage}</div>
                          <div><span className="text-[#b9cacb]">Previous Value:</span> <span className="text-green-400">{failure.previousValue}</span></div>
                          <div><span className="text-[#b9cacb]">New Value:</span> <span className="text-red-400">{failure.newValue}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-green-500/10 border border-green-500/30 p-4 rounded">
                    <div className="flex items-center gap-2 text-green-400 font-bold">
                      <CheckCircle className="w-5 h-5" />
                      ALL PIPELINES PASSED
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-[#b9cacb]">All Pipeline Stages:</h4>
                  {runtimeData.sections.pipelineVerification.stages.map((stage, index) => (
                    <div key={index} className="flex items-center gap-4 bg-[#111317] p-2 rounded">
                      <div className="text-xs text-[#b9cacb] w-24">{stage.pipeline}</div>
                      <div className="flex-1">
                        <div className="text-sm text-white">{stage.stage}</div>
                      </div>
                      <div className={`text-sm font-mono font-bold ${
                        stage.value === 0 ? 'text-red-400' : 'text-[#00f0ff]'
                      }`}>
                        {typeof stage.value === 'number' ? stage.value.toFixed(1) : stage.value}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* SECTION 11: Warnings */}
            <Card className="bg-[#0c0e12] border-[#1f2229]">
              <CardHeader>
                <CardTitle className="text-white">SECTION 11 — Warnings</CardTitle>
              </CardHeader>
              <CardContent>
                {runtimeData.warnings.length > 0 ? (
                  <div className="space-y-3">
                    {runtimeData.warnings.map((warning, index) => (
                      <div key={index} className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded">
                        <div className="flex items-center gap-2 text-yellow-400 font-bold mb-2">
                          <AlertTriangle className="w-5 h-5" />
                          WARNING
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="text-white">{warning.message}</div>
                          {warning.details && (
                            <JsonDisplay data={warning.details} title="Details" />
                          )}
                          <div className="text-xs text-[#b9cacb]">{warning.timestamp}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-green-500/10 border border-green-500/30 p-4 rounded">
                    <div className="flex items-center gap-2 text-green-400 font-bold">
                      <CheckCircle className="w-5 h-5" />
                      NO WARNINGS
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card className="bg-[#0c0e12] border-[#1f2229]">
              <CardHeader>
                <CardTitle className="text-white">Runtime Metadata</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-[#b9cacb]">User ID:</span> {runtimeData.userId}
                  </div>
                  <div>
                    <span className="text-[#b9cacb]">Cohort ID:</span> {runtimeData.cohortId}
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#b9cacb]">Timestamp:</span> {runtimeData.timestamp}
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#b9cacb]">Warnings Count:</span> {runtimeData.warnings.length}
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
