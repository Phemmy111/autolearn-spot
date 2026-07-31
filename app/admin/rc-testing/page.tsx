'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Play, 
  FileText,
  Download,
  RotateCcw,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { rcTestCases, TestResult, RCReport } from '@/lib/RC_TEST_DEFINITIONS'

export default function RCTestingDashboard() {
  const [sessionStarted, setSessionStarted] = useState(false)
  const [executedBy, setExecutedBy] = useState('')
  const [testResults, setTestResults] = useState<Map<string, TestResult>>(new Map())
  const [selectedTest, setSelectedTest] = useState<string | null>(null)
  const [report, setReport] = useState<RCReport | null>(null)

  const startSession = () => {
    if (!executedBy.trim()) return
    
    const now = new Date().toISOString()
    const newResults = new Map<string, TestResult>()
    
    rcTestCases.forEach(test => {
      newResults.set(test.id, {
        testId: test.id,
        status: 'pending',
        stepsExecuted: [],
        actualResult: '',
        notes: '',
        defects: [],
        severity: null,
        executedAt: now,
        executedBy
      })
    })
    
    setTestResults(newResults)
    setSessionStarted(true)
    setReport(null)
  }

  const updateTestResult = (testId: string, updates: Partial<TestResult>) => {
    const existing = testResults.get(testId)
    if (existing) {
      const updated = { ...existing, ...updates }
      testResults.set(testId, updated)
      setTestResults(new Map(testResults))
    }
  }

  const generateReport = () => {
    const results = Array.from(testResults.values())
    
    const passed = results.filter(r => r.status === 'pass').length
    const failed = results.filter(r => r.status === 'fail').length
    const skipped = results.filter(r => r.status === 'skipped').length
    
    const criticalFailures = results.filter(r => r.status === 'fail' && r.severity === 'critical').length
    const highFailures = results.filter(r => r.status === 'fail' && r.severity === 'high').length
    const mediumFailures = results.filter(r => r.status === 'fail' && r.severity === 'medium').length
    const lowFailures = results.filter(r => r.status === 'fail' && r.severity === 'low').length
    
    const blockingIssues = results
      .filter(r => r.status === 'fail' && (r.severity === 'critical' || r.severity === 'high'))
      .map(r => `${r.testId}: ${r.defects.join(', ')}`)
    
    const recommendation: 'GO' | 'NO-GO' = 
      criticalFailures === 0 && highFailures === 0 ? 'GO' : 'NO-GO'
    
    const newReport: RCReport = {
      version: '1.0.0',
      executedAt: new Date().toISOString(),
      executedBy,
      totalTests: results.length,
      passed,
      failed,
      skipped,
      criticalFailures,
      highFailures,
      mediumFailures,
      lowFailures,
      blockingIssues,
      recommendation,
      results
    }
    
    setReport(newReport)
  }

  const resetSession = () => {
    setSessionStarted(false)
    setTestResults(new Map())
    setSelectedTest(null)
    setReport(null)
    setExecutedBy('')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'fail': return <XCircle className="h-5 w-5 text-red-500" />
      case 'skipped': return <Clock className="h-5 w-5 text-gray-500" />
      default: return <Clock className="h-5 w-5 text-yellow-500" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const exportReport = () => {
    if (!report) return
    
    const reportText = `
# RC Test Report - AutoLearn Spot v${report.version}

**Executed At:** ${report.executedAt}
**Executed By:** ${report.executedBy}
**Total Tests:** ${report.totalTests}
**Passed:** ${report.passed}
**Failed:** ${report.failed}
**Skipped:** ${report.skipped}

## Failure Summary
- Critical: ${report.criticalFailures}
- High: ${report.highFailures}
- Medium: ${report.mediumFailures}
- Low: ${report.lowFailures}

## Blocking Issues
${report.blockingIssues.length > 0 ? report.blockingIssues.map(issue => `- ${issue}`).join('\n') : 'None'}

## Recommendation
${report.recommendation === 'GO' ? '✅ GO - Ready for production deployment' : '❌ NO-GO - Critical issues must be resolved'}

## Test Results
${report.results.map(result => {
  const test = rcTestCases.find(t => t.id === result.testId)
  return `
### ${test?.name} (${result.testId})
**Status:** ${result.status.toUpperCase()}
**Severity:** ${result.severity || 'N/A'}
**Expected:** ${test?.expectedResult}
**Actual:** ${result.actualResult || 'N/A'}
**Notes:** ${result.notes || 'N/A'}
**Defects:** ${result.defects.length > 0 ? result.defects.join(', ') : 'None'}
`
}).join('\n')}
`
    
    const blob = new Blob([reportText], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `RC-Report-${report.version}-${new Date().toISOString().split('T')[0]}.md`
    a.click()
  }

  const regressionTests = rcTestCases.filter(t => t.category === 'regression')
  const journeyTests = rcTestCases.filter(t => t.category === 'journey')

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
          <h1 className="font-heading text-4xl font-bold text-white mb-4">RC Testing Dashboard</h1>
          <p className="font-mono text-sm text-[#b9cacb]">Execute regression tests and generate RC report</p>
        </div>

        {!sessionStarted ? (
          <Card className="bg-[#0c0e12] border-[#1f2229]">
            <CardHeader>
              <CardTitle className="text-white">Start RC Testing Session</CardTitle>
              <CardDescription className="text-[#b9cacb]">Enter your name to begin testing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="executedBy" className="text-white">Tester Name</Label>
                <Input
                  id="executedBy"
                  placeholder="Enter your name"
                  value={executedBy}
                  onChange={(e) => setExecutedBy(e.target.value)}
                  className="bg-[#111317] border-[#1f2229] text-white"
                />
              </div>
              <Button
                onClick={startSession}
                disabled={!executedBy.trim()}
                className="w-full bg-[#00f0ff] text-black hover:bg-white"
              >
                <Play className="mr-2 h-4 w-4" />
                Start RC Testing Session
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="test-cases" className="space-y-4">
            <TabsList className="bg-[#111317] border-[#1f2229]">
              <TabsTrigger value="test-cases" className="data-[state=active]:bg-[#00f0ff] data-[state=active]:text-black">Test Cases</TabsTrigger>
              <TabsTrigger value="report" className="data-[state=active]:bg-[#00f0ff] data-[state=active]:text-black">Report</TabsTrigger>
            </TabsList>

            <TabsContent value="test-cases" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Testing Session</p>
                  <p className="text-sm text-[#b9cacb]">Tester: {executedBy}</p>
                </div>
                <Button
                  onClick={() => {
                    setSessionStarted(false)
                    setTestResults(new Map())
                    setReport(null)
                  }}
                  variant="outline"
                  className="border-[#1f2229] text-[#b9cacb] hover:bg-[#111317]"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset Session
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {rcTestCases.map((test) => {
                  const result = testResults.get(test.id)
                  const statusColor = result?.status === 'pass' ? 'text-green-400' :
                                     result?.status === 'fail' ? 'text-red-400' :
                                     result?.status === 'skipped' ? 'text-yellow-400' : 'text-[#b9cacb]'
                  return (
                    <Card
                      key={test.id}
                      className={`bg-[#0c0e12] border-[#1f2229] cursor-pointer hover:border-[#00f0ff]/50 transition-all ${selectedTest === test.id ? 'border-[#00f0ff]' : ''}`}
                      onClick={() => setSelectedTest(test.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-white text-base mb-1">{test.name}</CardTitle>
                            <CardDescription className="text-[#b9cacb] text-xs">{test.category}</CardDescription>
                          </div>
                          {result?.status === 'pass' && <CheckCircle2 className="h-5 w-5 text-green-400" />}
                          {result?.status === 'fail' && <XCircle className="h-5 w-5 text-red-400" />}
                          {result?.status === 'skipped' && <Clock className="h-5 w-5 text-yellow-400" />}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${statusColor}`}>
                            {result?.status ? result.status.toUpperCase() : 'PENDING'}
                          </span>
                          <Badge variant="outline" className="border-[#1f2229] text-[#b9cacb]">
                            {test.severity}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {selectedTest && (
                <Card className="bg-[#0c0e12] border-[#1f2229]">
                  <CardHeader>
                    <CardTitle className="text-white">Test Execution</CardTitle>
                    <CardDescription className="text-[#b9cacb]">
                      {rcTestCases.find(t => t.id === selectedTest)?.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-white">Status</Label>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => updateTestResult(selectedTest, { status: 'pass' })}
                          variant={testResults.get(selectedTest)?.status === 'pass' ? 'default' : 'outline'}
                          className={testResults.get(selectedTest)?.status === 'pass' ? 'bg-green-500 text-white' : 'border-[#1f2229] text-[#b9cacb]'}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Pass
                        </Button>
                        <Button
                          onClick={() => updateTestResult(selectedTest, { status: 'fail' })}
                          variant={testResults.get(selectedTest)?.status === 'fail' ? 'default' : 'outline'}
                          className={testResults.get(selectedTest)?.status === 'fail' ? 'bg-red-500 text-white' : 'border-[#1f2229] text-[#b9cacb]'}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Fail
                        </Button>
                        <Button
                          onClick={() => updateTestResult(selectedTest, { status: 'skipped' })}
                          variant={testResults.get(selectedTest)?.status === 'skipped' ? 'default' : 'outline'}
                          className={testResults.get(selectedTest)?.status === 'skipped' ? 'bg-yellow-500 text-white' : 'border-[#1f2229] text-[#b9cacb]'}
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          Skip
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Actual Result</Label>
                      <Textarea
                        placeholder="Describe what actually happened"
                        value={testResults.get(selectedTest)?.actualResult || ''}
                        onChange={(e) => updateTestResult(selectedTest, { actualResult: e.target.value })}
                        className="bg-[#111317] border-[#1f2229] text-white min-h-[100px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white">Notes</Label>
                      <Textarea
                        placeholder="Additional notes or observations"
                        value={testResults.get(selectedTest)?.notes || ''}
                        onChange={(e) => updateTestResult(selectedTest, { notes: e.target.value })}
                        className="bg-[#111317] border-[#1f2229] text-white min-h-[80px]"
                      />
                    </div>

                    {testResults.get(selectedTest)?.status === 'fail' && (
                      <div className="space-y-2">
                        <Label className="text-white">Severity</Label>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => updateTestResult(selectedTest, { severity: 'critical' })}
                            variant={testResults.get(selectedTest)?.severity === 'critical' ? 'default' : 'outline'}
                            className={testResults.get(selectedTest)?.severity === 'critical' ? 'bg-red-600 text-white' : 'border-[#1f2229] text-[#b9cacb]'}
                            size="sm"
                          >
                            Critical
                          </Button>
                          <Button
                            onClick={() => updateTestResult(selectedTest, { severity: 'high' })}
                            variant={testResults.get(selectedTest)?.severity === 'high' ? 'default' : 'outline'}
                            className={testResults.get(selectedTest)?.severity === 'high' ? 'bg-orange-500 text-white' : 'border-[#1f2229] text-[#b9cacb]'}
                            size="sm"
                          >
                            High
                          </Button>
                          <Button
                            onClick={() => updateTestResult(selectedTest, { severity: 'medium' })}
                            variant={testResults.get(selectedTest)?.severity === 'medium' ? 'default' : 'outline'}
                            className={testResults.get(selectedTest)?.severity === 'medium' ? 'bg-yellow-500 text-white' : 'border-[#1f2229] text-[#b9cacb]'}
                            size="sm"
                          >
                            Medium
                          </Button>
                          <Button
                            onClick={() => updateTestResult(selectedTest, { severity: 'low' })}
                            variant={testResults.get(selectedTest)?.severity === 'low' ? 'default' : 'outline'}
                            className={testResults.get(selectedTest)?.severity === 'low' ? 'bg-gray-500 text-white' : 'border-[#1f2229] text-[#b9cacb]'}
                            size="sm"
                          >
                            Low
                          </Button>
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={() => setSelectedTest(null)}
                      variant="outline"
                      className="w-full border-[#1f2229] text-[#b9cacb] hover:bg-[#111317]"
                    >
                      Close Test Details
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="report" className="space-y-4">
              <Card className="bg-[#0c0e12] border-[#1f2229]">
                <CardHeader>
                  <CardTitle className="text-white">RC Report</CardTitle>
                  <CardDescription className="text-[#b9cacb]">Summary of test execution results</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!report ? (
                    <Button
                      onClick={generateReport}
                      className="w-full bg-[#00f0ff] text-black hover:bg-white"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Generate Report
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-4">
                        <div className="space-y-1">
                          <p className="text-sm text-[#b9cacb]">Total Tests</p>
                          <p className="text-2xl font-bold text-white">{report.totalTests}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-[#b9cacb]">Passed</p>
                          <p className="text-2xl font-bold text-green-400">{report.passed}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-[#b9cacb]">Failed</p>
                          <p className="text-2xl font-bold text-red-400">{report.failed}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-[#b9cacb]">Skipped</p>
                          <p className="text-2xl font-bold text-yellow-400">{report.skipped}</p>
                        </div>
                      </div>

                      <div className="border-t border-[#1f2229] pt-4">
                        <h3 className="text-white font-medium mb-2">Failure Breakdown</h3>
                        <div className="grid gap-2 md:grid-cols-4">
                          <div className="space-y-1">
                            <p className="text-sm text-[#b9cacb]">Critical</p>
                            <p className="text-xl font-bold text-red-600">{report.criticalFailures}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-[#b9cacb]">High</p>
                            <p className="text-xl font-bold text-orange-500">{report.highFailures}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-[#b9cacb]">Medium</p>
                            <p className="text-xl font-bold text-yellow-500">{report.mediumFailures}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-[#b9cacb]">Low</p>
                            <p className="text-xl font-bold text-gray-400">{report.lowFailures}</p>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-[#1f2229] pt-4">
                        <h3 className="text-white font-medium mb-2">Recommendation</h3>
                        <Badge className={report.recommendation === 'GO' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}>
                          {report.recommendation}
                        </Badge>
                      </div>

                      {report.blockingIssues.length > 0 && (
                        <div className="border-t border-[#1f2229] pt-4">
                          <h3 className="text-white font-medium mb-2">Blocking Issues</h3>
                          <ul className="space-y-1">
                            {report.blockingIssues.map((issue, idx) => (
                              <li key={idx} className="text-sm text-red-400">{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <Button
                        onClick={exportReport}
                        className="w-full bg-[#00f0ff] text-black hover:bg-white"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export Report
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
