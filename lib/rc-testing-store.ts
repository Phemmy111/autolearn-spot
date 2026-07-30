import { rcTestCases, TestResult, RCReport } from './RC_TEST_DEFINITIONS'

// In-memory store for test results (in production, use database)
let testResults: Map<string, TestResult> = new Map()
let rcSession: {
  startedAt: string | null
  executedBy: string | null
  version: string
} = {
  startedAt: null,
  executedBy: null,
  version: '1.0.0'
}

/**
 * Start a new RC testing session
 */
export function startRCSession(executedBy: string) {
  rcSession = {
    startedAt: new Date().toISOString(),
    executedBy,
    version: '1.0.0'
  }
  testResults.clear()
  
  // Initialize all tests as pending
  rcTestCases.forEach(test => {
    testResults.set(test.id, {
      testId: test.id,
      status: 'pending',
      stepsExecuted: [],
      actualResult: '',
      notes: '',
      defects: [],
      severity: null,
      executedAt: new Date().toISOString(),
      executedBy
    })
  })
}

/**
 * Record test result
 */
export function recordTestResult(result: Omit<TestResult, 'executedAt' | 'executedBy'>) {
  const existing = testResults.get(result.testId)
  testResults.set(result.testId, {
    ...result,
    executedAt: new Date().toISOString(),
    executedBy: rcSession.executedBy || 'unknown'
  })
}

/**
 * Get all test results
 */
export function getTestResults(): TestResult[] {
  return Array.from(testResults.values())
}

/**
 * Get test result by ID
 */
export function getTestResult(testId: string): TestResult | undefined {
  return testResults.get(testId)
}

/**
 * Get RC session info
 */
export function getRCSession() {
  return rcSession
}

/**
 * Generate RC report
 */
export function generateRCReport(): RCReport {
  const results = getTestResults()
  
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
  
  // GO/NO-GO recommendation
  const recommendation: 'GO' | 'NO-GO' = 
    criticalFailures === 0 && highFailures === 0 ? 'GO' : 'NO-GO'
  
  return {
    version: rcSession.version,
    executedAt: rcSession.startedAt || new Date().toISOString(),
    executedBy: rcSession.executedBy || 'unknown',
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
}

/**
 * Reset RC session
 */
export function resetRCSession() {
  testResults.clear()
  rcSession = {
    startedAt: null,
    executedBy: null,
    version: '1.0.0'
  }
}
