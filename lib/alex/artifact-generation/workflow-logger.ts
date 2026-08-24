/**
 * ALEX Workflow Logger
 * 
 * Phase 3A Runtime Stabilization: Structured logging for workflow pipeline
 * Enables diagnostic capabilities without exposing secrets
 */

export interface WorkflowLogEntry {
  workflow_request_id: string
  conversation_id: string
  user_id: string
  stage: string
  model?: string
  operation: string
  estimated_input_tokens?: number
  estimated_output_tokens?: number
  duration_ms: number
  success: boolean
  error?: string
  timestamp: string
}

export class WorkflowLogger {
  private static logs: WorkflowLogEntry[] = []
  private static maxLogEntries = 1000

  /**
   * Log a workflow operation
   */
  static log(entry: Omit<WorkflowLogEntry, 'timestamp'>): void {
    const logEntry: WorkflowLogEntry = {
      ...entry,
      timestamp: new Date().toISOString()
    }

    this.logs.push(logEntry)

    // Keep log size bounded
    if (this.logs.length > this.maxLogEntries) {
      this.logs.shift()
    }

    // Also log to console for immediate visibility
    console.log('[WORKFLOW LOG]', JSON.stringify(logEntry))
  }

  /**
   * Log with automatic duration tracking
   */
  static async logWithTiming<T>(
    entry: Omit<WorkflowLogEntry, 'duration_ms' | 'timestamp'>,
    operation: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now()
    let success = true
    let error: string | undefined

    try {
      const result = await operation()
      const duration = Date.now() - startTime

      this.log({
        ...entry,
        duration_ms: duration,
        success: true
      })

      return result
    } catch (err) {
      success = false
      error = err instanceof Error ? err.message : 'Unknown error'
      const duration = Date.now() - startTime

      this.log({
        ...entry,
        duration_ms: duration,
        success: false,
        error
      })

      throw err
    }
  }

  /**
   * Get logs for a specific workflow
   */
  static getWorkflowLogs(workflowRequestId: string): WorkflowLogEntry[] {
    return this.logs.filter(log => log.workflow_request_id === workflowRequestId)
  }

  /**
   * Get logs for a specific conversation
   */
  static getConversationLogs(conversationId: string): WorkflowLogEntry[] {
    return this.logs.filter(log => log.conversation_id === conversationId)
  }

  /**
   * Get logs for a specific user
   */
  static getUserLogs(userId: string): WorkflowLogEntry[] {
    return this.logs.filter(log => log.user_id === userId)
  }

  /**
   * Get failed logs
   */
  static getFailedLogs(): WorkflowLogEntry[] {
    return this.logs.filter(log => !log.success)
  }

  /**
   * Clear logs (useful for testing)
   */
  static clearLogs(): void {
    this.logs = []
  }

  /**
   * Get summary statistics
   */
  static getSummary(): {
    totalLogs: number
    successCount: number
    failureCount: number
    averageDuration: number
    byStage: Record<string, number>
  } {
    const totalLogs = this.logs.length
    const successCount = this.logs.filter(log => log.success).length
    const failureCount = totalLogs - successCount
    const averageDuration = totalLogs > 0 
      ? this.logs.reduce((sum, log) => sum + log.duration_ms, 0) / totalLogs 
      : 0

    const byStage: Record<string, number> = {}
    for (const log of this.logs) {
      byStage[log.stage] = (byStage[log.stage] || 0) + 1
    }

    return {
      totalLogs,
      successCount,
      failureCount,
      averageDuration,
      byStage
    }
  }
}
