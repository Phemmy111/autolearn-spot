/**
 * Tool Execution Service - Centralized tool execution with security and validation
 * 
 * This service handles:
 * - Tool execution with timeout protection
 * - Authorization checks
 * - Argument validation
 * - Result normalization
 * - Execution logging/auditing
 * - Error handling
 */

import { ToolRegistry } from './tool-registry'
import { ToolCall, ToolResult, ToolExecutionContext, ToolExecutionRecord } from '../types'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables for tool execution service')
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export class ToolExecutionService {
  private registry: ToolRegistry
  private maxToolCallsPerRequest: number = 5 // Conservative limit for Phase 5
  private requestCallCount: Map<string, number> = new Map() // Track calls per request

  constructor(registry: ToolRegistry) {
    this.registry = registry
  }

  /**
   * Execute a tool call
   */
  async executeTool(call: ToolCall, context: ToolExecutionContext): Promise<ToolResult> {
    const startTime = Date.now()
    const toolCallId = call.id || this.generateToolCallId()

    // Check tool call limit
    const requestKey = `${context.userId}-${context.conversationId || 'no-conv'}`
    const currentCount = this.requestCallCount.get(requestKey) || 0
    if (currentCount >= this.maxToolCallsPerRequest) {
      const error = `Maximum tool call limit (${this.maxToolCallsPerRequest}) exceeded for this request`
      console.error('[Tool Execution Service]', error)
      return {
        toolCallId,
        toolName: call.toolName,
        success: false,
        error,
        executionTimeMs: Date.now() - startTime
      }
    }
    this.requestCallCount.set(requestKey, currentCount + 1)

    try {
      // Check if tool exists
      const tool = this.registry.getTool(call.toolName)
      if (!tool) {
        const error = `Tool "${call.toolName}" not found`
        console.error('[Tool Execution Service]', error)
        return {
          toolCallId,
          toolName: call.toolName,
          success: false,
          error,
          executionTimeMs: Date.now() - startTime
        }
      }

      // Check if tool is enabled
      if (!tool.definition.enabled) {
        const error = `Tool "${call.toolName}" is disabled`
        console.error('[Tool Execution Service]', error)
        return {
          toolCallId,
          toolName: call.toolName,
          success: false,
          error,
          executionTimeMs: Date.now() - startTime
        }
      }

      // Validate arguments
      const validation = this.registry.validateToolArguments(call.toolName, call.arguments)
      if (!validation.valid) {
        const error = `Invalid arguments for tool "${call.toolName}": ${validation.error}`
        console.error('[Tool Execution Service]', error)
        return {
          toolCallId,
          toolName: call.toolName,
          success: false,
          error,
          executionTimeMs: Date.now() - startTime
        }
      }

      // Get tool timeout
      const timeoutMs = tool.definition.timeoutMs || 30000 // Default 30 seconds

      // Execute tool with timeout
      const result = await Promise.race([
        tool.executor.execute(call.arguments, context),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Tool execution timeout after ${timeoutMs}ms`)), timeoutMs)
        )
      ])

      const executionTimeMs = Date.now() - startTime

      // Log successful execution
      await this.logExecution({
        toolCallId,
        toolName: call.toolName,
        userId: context.userId,
        conversationId: context.conversationId,
        arguments: call.arguments,
        success: true,
        result,
        executionTimeMs
      })

      console.log(`[Tool Execution Service] Tool "${call.toolName}" executed successfully in ${executionTimeMs}ms`)

      return {
        toolCallId,
        toolName: call.toolName,
        success: true,
        result,
        executionTimeMs
      }
    } catch (error) {
      const executionTimeMs = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      // Log failed execution
      await this.logExecution({
        toolCallId,
        toolName: call.toolName,
        userId: context.userId,
        conversationId: context.conversationId,
        arguments: call.arguments,
        success: false,
        error: errorMessage,
        executionTimeMs
      })

      console.error(`[Tool Execution Service] Tool "${call.toolName}" failed:`, errorMessage)

      return {
        toolCallId,
        toolName: call.toolName,
        success: false,
        error: errorMessage,
        executionTimeMs
      }
    }
  }

  /**
   * Execute multiple tool calls (with limit enforcement)
   */
  async executeTools(calls: ToolCall[], context: ToolExecutionContext): Promise<ToolResult[]> {
    // Enforce limit across all calls
    if (calls.length > this.maxToolCallsPerRequest) {
      console.warn(`[Tool Execution Service] Requested ${calls.length} tool calls, limiting to ${this.maxToolCallsPerRequest}`)
      calls = calls.slice(0, this.maxToolCallsPerRequest)
    }

    // Execute in parallel
    const results = await Promise.all(
      calls.map(call => this.executeTool(call, context))
    )

    return results
  }

  /**
   * Reset call count for a request (call at start of new request)
   */
  resetRequestCallCount(userId: string, conversationId?: string): void {
    const requestKey = `${userId}-${conversationId || 'no-conv'}`
    this.requestCallCount.set(requestKey, 0)
  }

  /**
   * Set max tool calls per request
   */
  setMaxToolCallsPerRequest(limit: number): void {
    if (limit < 1 || limit > 20) {
      throw new Error('Max tool calls per request must be between 1 and 20')
    }
    this.maxToolCallsPerRequest = limit
  }

  /**
   * Generate a unique tool call ID
   */
  private generateToolCallId(): string {
    return `tool_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * Log tool execution to database
   */
  private async logExecution(data: {
    toolCallId: string
    toolName: string
    userId: string
    conversationId?: string
    arguments: Record<string, any>
    success: boolean
    result?: any
    error?: string
    executionTimeMs: number
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('alex_tool_executions')
        .insert({
          tool_call_id: data.toolCallId,
          tool_name: data.toolName,
          user_id: data.userId,
          conversation_id: data.conversationId,
          arguments: data.arguments,
          success: data.success,
          result: data.success ? data.result : null,
          error: !data.success ? data.error : null,
          execution_time_ms: data.executionTimeMs
        })

      if (error) {
        console.error('[Tool Execution Service] Failed to log execution:', error)
      }
    } catch (error) {
      console.error('[Tool Execution Service] Failed to log execution:', error)
      // Don't fail the tool execution if logging fails
    }
  }

  /**
   * Get execution history for a user
   */
  async getExecutionHistory(userId: string, limit: number = 50): Promise<ToolExecutionRecord[]> {
    try {
      const { data, error } = await supabase
        .from('alex_tool_executions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('[Tool Execution Service] Failed to fetch execution history:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('[Tool Execution Service] Failed to fetch execution history:', error)
      return []
    }
  }
}
