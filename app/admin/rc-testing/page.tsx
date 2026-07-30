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
  RotateCcw
} from 'lucide-react'
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

  if (!sessionStarted) {
    return (
      <div className="min-h-screen bg-[#0a0c10]">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <Card className="bg-[#0c0e12] border-[#1f2229]">
            <CardHeader>
              <CardTitle className="text-white text-2xl">RC Testing Dashboard</CardTitle>
              <CardDescription className="text-[#b9cacb]">
                AutoLearn Spot v1.0.0 Release Candidate Testing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="executedBy" className="text-[#b9cacb]">Tester Name</Label>
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
                className="w-full bg-[#00f0ff] text-black hover:bg-[#00c0cc]"
              >
                <Play className="mr-2 h-4 w-4" />
                Start RC Testing Session
              </Button>
              <div className="text-sm text-[#5d5f63] space-y-1 pt-4">
                <p><strong>Total Tests:</strong> {rcTestCases.length}</p>
                <p><strong>Regression Tests:</strong> {regressionTests.length}</p>
                <p><strong>Journey Tests:</strong> {journeyTests.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const selectedTestCase = selectedTest ? rcTestCases.find(t => t.id === selectedTest) : null
  const selectedResult = selectedTest ? testResults.get(selectedTest) : null

  return (
    <div className="min-h-screen bg-[#0a0c10]">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold text-white mb-2">RC Testing Dashboard</h1>
            <p className="font-mono text-sm text-[#b9cacb]">
              AutoLearn Spot v1.0.0 | Tester: {executedBy}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={generateReport}
              variant="outline"
              className="border-[#1f2229] text-[#b9cacb] hover:bg-[#111317]"
            >
              <FileText className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
            {report && (
              <Button 
                onClick={exportReport}
                variant="outline"
                className="border-[#1f2229] text-[#b9cacb] hover:bg-[#111317]"
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            )}
            <Button 
              onClick={resetSession}
              variant="outline"
              className="border-[#1f2229] text-[#b9cacb] hover:bg-[#111317]"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>

        {report && (
          <Card className={`mb-8 border-2 ${report.recommendation === 'GO' ? 'border-green-500' : 'border-red-500'}`}>
            <CardHeader>
              <CardTitle className={`text-2xl ${report.recommendation === 'GO' ? 'text-green-400' : 'text-red-400'}`}>
                {report.recommendation === 'GO' ? '✅ GO - Ready for Production' : '❌ NO-GO - Issues Must Be Resolved'}
              </CardTitle>
              <CardDescription className="text-[#b9cacb]">
                {report.totalTests} tests | {report.passed} passed | {report.failed} failed | {report.skipped} skipped
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-400">{report.criticalFailures}</p>
                  <p className="text-sm text-[#5d5f63]">Critical</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-400">{report.highFailures}</p>
                  <p className="text-sm text-[#5d5f63]">High</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-400">{report.mediumFailures}</p>
                  <p className="text-sm text-[#5d5f63]">Medium</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-400">{report.lowFailures}</p>
                  <p className="text-sm text-[#5d5f63]">Low</p>
                </div>
              </div>
              {report.blockingIssues.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-red-400">Blocking Issues:</p>
                  {report.blockingIssues.map((issue, i) => (
                    <p key={i} className="text-sm text-[#b9cacb]">• {issue}</p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Card className="bg-[#0c0e12] border-[#1f2229]">
              <CardHeader>
                <CardTitle className="text-white">Test Cases</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="regression">
                  <TabsList className="bg-[#111317] w-full">
                    <TabsTrigger value="regression" className="flex-1 data-[state=active]:bg-[#1f2229]">
                      Regression ({regressionTests.length})
                    </TabsTrigger>
                    <TabsTrigger value="journey" className="flex-1 data-[state=active]:bg-[#1f2229]">
                      Journey ({journeyTests.length})
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="regression" className="mt-4 space-y-2">
                    {regressionTests.map(test => {
                      const result = testResults.get(test.id)
                      return (
                        <button
                          key={test.id}
                          onClick={() => setSelectedTest(test.id)}
                          className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            selectedTest === test.id
                              ? 'bg-[#00f0ff] text-black border-[#00f0ff]'
                              : 'bg-[#111317] border-[#1f2229] hover:border-[#3b494b]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{test.name}</span>
                            {getStatusIcon(result?.status || 'pending')}
                          </div>
                          <span className="text-xs opacity-70">{test.id}</span>
                        </button>
                      )
                    })}
                  </TabsContent>
                  <TabsContent value="journey" className="mt-4 space-y-2">
                    {journeyTests.map(test => {
                      const result = testResults.get(test.id)
                      return (
                        <button
                          key={test.id}
                          onClick={() => setSelectedTest(test.id)}
                          className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            selectedTest === test.id
                              ? 'bg-[#00f0ff] text-black border-[#00f0ff]'
                              : 'bg-[#111317] border-[#1f2229] hover:border-[#3b494b]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{test.name}</span>
                            {getStatusIcon(result?.status || 'pending')}
                          </div>
                          <span className="text-xs opacity-70">{test.id}</span>
                        </button>
                      )
                    })}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {selectedTestCase && selectedResult ? (
              <Card className="bg-[#0c0e12] border-[#1f2229]">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-white">{selectedTestCase.name}</CardTitle>
                      <CardDescription className="text-[#b9cacb]">{selectedTestCase.id}</CardDescription>
                    </div>
                    <Badge className={getSeverityColor(selectedTestCase.severity)}>
                      {selectedTestCase.severity.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-[#b9cacb] mb-2 block">Description</Label>
                    <p className="text-sm text-white">{selectedTestCase.description}</p>
                  </div>

                  <div>
                    <Label className="text-[#b9cacb] mb-2 block">Test Steps</Label>
                    <ol className="text-sm text-white space-y-1 list-decimal list-inside">
                      {selectedTestCase.steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>

                  <div>
                    <Label className="text-[#b9cacb] mb-2 block">Expected Result</Label>
                    <p className="text-sm text-white">{selectedTestCase.expectedResult}</p>
                  </div>

                  <div className="border-t border-[#1f2229] pt-6 space-y-4">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => updateTestResult(selectedTestCase.id, { status: 'pass' })}
                        className={selectedResult.status === 'pass' ? 'bg-green-500' : 'bg-[#111317] border-[#1f2229]'}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Pass
                      </Button>
                      <Button
                        onClick={() => updateTestResult(selectedTestCase.id, { status: 'fail' })}
                        className={selectedResult.status === 'fail' ? 'bg-red-500' : 'bg-[#111317] border-[#1f2229]'}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Fail
                      </Button>
                      <Button
                        onClick={() => updateTestResult(selectedTestCase.id, { status: 'skipped' })}
                        className={selectedResult.status === 'skipped' ? 'bg-gray-500' : 'bg-[#111317] border-[#1f2229]'}
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        Skip
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#b9cacb]">Actual Result</Label>
                      <Textarea
                        placeholder="Describe the actual result..."
                        value={selectedResult.actualResult}
                        onChange={(e) => updateTestResult(selectedTestCase.id, { actualResult: e.target.value })}
                        className="bg-[#111317] border-[#1f2229] text-white min-h-[80px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#b9cacb]">Notes</Label>
                      <Textarea
                        placeholder="Add any additional notes..."
                        value={selectedResult.notes}
                        onChange={(e) => updateTestResult(selectedTestCase.id, { notes: e.target.value })}
                        className="bg-[#111317] border-[#1f2229] text-white min-h-[80px]"
                      />
                    </div>

                    {selectedResult.status === 'fail' && (
                      <div className="space-y-2">
                        <Label className="text-[#b9cacb]">Defects (comma-separated)</Label>
                        <Input
                          placeholder="e.g., API timeout, UI not rendering, Data mismatch"
                          value={selectedResult.defects.join(', ')}
                          onChange={(e) => updateTestResult(selectedTestCase.id, { 
                            defects: e.target.value.split(',').map(d => d.trim()).filter(d => d) 
                          })}
                          className="bg-[#111317] border-[#1f2229] text-white"
                        />
                      </div>
                    )}

                    {selectedResult.status === 'fail' && (
                      <div className="space-y-2">
                        <Label className="text-[#b9cacb]">Severity</Label>
                        <div className="flex gap-2">
                          {(['critical', 'high', 'medium', 'low'] as const).map(sev => (
                            <Button
                              key={sev}
                              onClick={() => updateTestResult(selectedTestCase.id, { severity: sev })}
                              className={selectedResult.severity === sev ? getSeverityColor(sev) : 'bg-[#111317] border-[#1f2229]'}
                            >
                              {sev.charAt(0).toUpperCase() + sev.slice(1)}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="text-[#b9cacb]">API Response (if applicable)</Label>
                      <Textarea
                        placeholder="Paste API response JSON..."
                        value={selectedResult.apiResponse || ''}
                        onChange={(e) => updateTestResult(selectedTestCase.id, { apiResponse: e.target.value })}
                        className="bg-[#111317] border-[#1f2229] text-white min-h-[80px] font-mono text-xs"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#b9cacb]">SQL Output (if applicable)</Label>
                      <Textarea
                        placeholder="Paste SQL query output..."
                        value={selectedResult.sqlOutput || ''}
                        onChange={(e) => updateTestResult(selectedTestCase.id, { sqlOutput: e.target.value })}
                        className="bg-[#111317] border-[#1f2229] text-white min-h-[80px] font-mono text-xs"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-[#0c0e12] border-[#1f2229]">
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 text-[#5d5f63] mx-auto mb-4" />
                  <p className="text-[#b9cacb]">Select a test case to begin</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
