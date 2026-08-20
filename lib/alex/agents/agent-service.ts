/**
 * Phase 6: Agent Service
 * 
 * Controlled multi-step agent execution with safety limits.
 * Reuses existing ToolRegistry and ToolExecutionService.
 */

import {
  AgentExecutionState,
  AgentExecutionResult,
  AgentExecutionRequest,
  AgentStep,
  AgentExecutionStatus,
  AgentStepType
} from './agent-types'
import { getAgentConfig, AgentConfig } from './agent-config'
import { ToolRegistry, ToolExecutionService, ToolCall, ToolResult } from '../tools'
import { AIEngine } from '../ai-engine'
import { AIMessage } from '../provider/provider-interface'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables for agent service')
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export class AgentService {
  private toolRegistry: ToolRegistry
  private toolExecutionService: ToolExecutionService
  private aiEngine: AIEngine
  private config: AgentConfig

  constructor(
    toolRegistry: ToolRegistry,
    toolExecutionService: ToolExecutionService,
    aiEngine: AIEngine,
    config?: Partial<AgentConfig>
  ) {
    this.toolRegistry = toolRegistry
    this.toolExecutionService = toolExecutionService
    this.aiEngine = aiEngine
    this.config = getAgentConfig(config)
  }

  /**
   * Execute an agent request with controlled multi-step execution
   */
  async execute(
    request: AgentExecutionRequest,
    onProgress?: (step: AgentStep) => void
  ): Promise<AgentExecutionResult> {
    const executionId = this.generateExecutionId()
    const startedAt = new Date().toISOString()

    console.log('[AgentDebug] execution_started', {
      executionId,
      userId: request.userId,
      content: request.content.substring(0, 100)
    })

    // Initialize execution state
    const state: AgentExecutionState = {
      executionId,
      userId: request.userId,
      conversationId: request.conversationId,
      status: 'planning',
      stepCount: 0,
      toolCallCount: 0,
      consecutiveFailures: 0,
      startedAt,
      history: [],
      metadata: {
        originalContent: request.content,
        mode: request.mode
      }
    }

    // Log execution start to database
    await this.logExecutionStart(state)

    try {
      state.status = 'executing'
      await this.updateExecutionStatus(executionId, 'executing')

      // Build initial context
      const context = this.buildInitialContext(request, state)

      // Main agent loop
      let iterationCount = 0
      let finalResponse: string | undefined

      while (iterationCount < this.config.maxAgentSteps) {
        // Check cancellation
        if (request.signal?.aborted) {
          console.log('[AgentDebug] cancelled', { executionId })
          state.status = 'cancelled'
          state.completedAt = new Date().toISOString()
          await this.updateExecutionStatus(executionId, 'cancelled')
          return this.buildResult(state, 'Agent execution cancelled by user')
        }

        // Check timeout
        const elapsed = Date.now() - new Date(startedAt).getTime()
        if (elapsed > this.config.maxAgentExecutionTime) {
          console.log('[AgentDebug] limit_reached', {
            executionId,
            reason: 'timeout',
            elapsed
          })
          state.status = 'limit_reached'
          state.completedAt = new Date().toISOString()
          await this.updateExecutionStatus(executionId, 'limit_reached')
          return this.buildResult(state, 'Agent execution timed out')
        }

        // Check tool call limit
        if (state.toolCallCount >= this.config.maxToolCalls) {
          console.log('[AgentDebug] limit_reached', {
            executionId,
            reason: 'max_tool_calls',
            toolCallCount: state.toolCallCount
          })
          state.status = 'limit_reached'
          state.completedAt = new Date().toISOString()
          await this.updateExecutionStatus(executionId, 'limit_reached')
          return this.buildResult(state, 'Maximum tool calls reached')
        }

        // Execute model step
        console.log('[AgentDebug] step_started', {
          executionId,
          stepNumber: state.stepCount + 1
        })

        const modelStep = await this.executeModelStep(request, context, state)
        state.history.push(modelStep)
        state.stepCount++

        if (onProgress) {
          onProgress(modelStep)
        }

        // If model returned final text, we're done
        if (modelStep.type === 'final' && modelStep.result) {
          finalResponse = modelStep.result as string
          console.log('[AgentDebug] execution_completed', {
            executionId,
            stepCount: state.stepCount
          })
          state.status = 'completed'
          state.completedAt = new Date().toISOString()
          await this.updateExecutionStatus(executionId, 'completed')
          return this.buildResult(state, undefined, finalResponse)
        }

        // If model emitted a tool call, execute it
        if (modelStep.type === 'tool_call' && modelStep.toolName && modelStep.arguments) {
          // Check for repeated tool calls
          if (this.detectRepeatedTool(state, modelStep.toolName)) {
            console.log('[AgentDebug] limit_reached', {
              executionId,
              reason: 'repeated_tool',
              toolName: modelStep.toolName
            })
            state.status = 'limit_reached'
            state.completedAt = new Date().toISOString()
            await this.updateExecutionStatus(executionId, 'limit_reached')
            return this.buildResult(state, 'Tool repetition limit reached')
          }

          // Execute tool
          const toolResult = await this.executeToolStep(
            modelStep.toolName,
            modelStep.arguments,
            request,
            state
          )

          state.history.push(toolResult)
          state.toolCallCount++

          if (onProgress) {
            onProgress(toolResult)
          }

          // Check for consecutive failures
          if (!toolResult.success) {
            state.consecutiveFailures++
            if (state.consecutiveFailures >= this.config.maxConsecutiveFailures) {
              console.log('[AgentDebug] execution_failed', {
                executionId,
                reason: 'consecutive_failures',
                consecutiveFailures: state.consecutiveFailures
              })
              state.status = 'failed'
              state.completedAt = new Date().toISOString()
              await this.updateExecutionStatus(executionId, 'failed')
              return this.buildResult(state, 'Maximum consecutive tool failures reached')
            }
          } else {
            state.consecutiveFailures = 0
          }

          // Append tool result to context for next iteration
          context = this.appendToolResult(context, toolResult, state)
        }

        iterationCount++
      }

      // If we exit loop without final response
      console.log('[AgentDebug] limit_reached', {
        executionId,
        reason: 'max_steps',
        steps: iterationCount
      })
      state.status = 'limit_reached'
      state.completedAt = new Date().toISOString()
      await this.updateExecutionStatus(executionId, 'limit_reached')
      return this.buildResult(state, 'Maximum agent steps reached')

    } catch (error) {
      console.error('[AgentDebug] execution_failed', {
        executionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      state.status = 'failed'
      state.completedAt = new Date().toISOString()
      await this.updateExecutionStatus(executionId, 'failed')
      return this.buildResult(
        state,
        error instanceof Error ? error.message : 'Unknown error'
      )
    }
  }

  /**
   * Execute a model step (get model response)
   */
  private async executeModelStep(
    request: AgentExecutionRequest,
    context: string,
    state: AgentExecutionState
  ): Promise<AgentStep> {
    const startTime = Date.now()

    try {
      // Build messages for AI engine
      const messages: AIMessage[] = [
        {
          role: 'system',
          content: request.systemPrompt
        },
        ...request.conversationHistory.slice(-5), // Limit history for token budget
        {
          role: 'user',
          content: request.content
        }
      ]

      // Add agent execution history as context
      if (state.history.length > 0) {
        const historyContext = this.formatAgentHistory(state.history)
        messages.push({
          role: 'system',
          content: `Previous agent steps:\n${historyContext}`
        })
      }

      // Call AI engine with tools enabled
      const response = await this.aiEngine.chat({
        messages,
        userId: request.userId,
        conversationId: request.conversationId,
        modelName: request.modelName,
        providerManager: request.providerManager,
        providerRegistry: request.providerRegistry,
        enableTools: true,
        toolRegistry: this.toolRegistry,
        toolExecutionService: this.toolExecutionService,
        enableWebResearch: request.enableWebResearch,
        webResearchService: request.webResearchService,
        enableMemory: request.enableMemory,
        disableTools: false
      })

      const durationMs = Date.now() - startTime

      // Check if response contains a tool call
      // For now, we'll treat all responses as final since the AI engine
      // handles tool execution internally in Phase 5
      // In Phase 6, we intercept tool calls to control the loop

      return {
        stepNumber: state.stepCount + 1,
        type: 'final',
        result: response.content,
        durationMs,
        timestamp: new Date().toISOString()
      }

    } catch (error) {
      const durationMs = Date.now() - startTime
      return {
        stepNumber: state.stepCount + 1,
        type: 'model',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs,
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Execute a tool step
   */
  private async executeToolStep(
    toolName: string,
    arguments: Record<string, unknown>,
    request: AgentExecutionRequest,
    state: AgentExecutionState
  ): Promise<AgentStep> {
    const startTime = Date.now()
    const toolCallId = this.generateToolCallId()

    console.log('[AgentDebug] tool_call', {
      executionId: state.executionId,
      toolName,
      toolCallId
    })

    try {
      const toolCall: ToolCall = {
        id: toolCallId,
        toolName,
        arguments
      }

      const result = await this.toolExecutionService.executeTool(toolCall, {
        userId: request.userId,
        conversationId: request.conversationId
      })

      const durationMs = Date.now() - startTime

      console.log('[AgentDebug] tool_result', {
        executionId: state.executionId,
        toolName,
        success: result.success,
        durationMs
      })

      return {
        stepNumber: state.stepCount + 1,
        type: 'tool_result',
        toolName,
        toolCallId,
        arguments,
        result: result.result,
        success: result.success,
        durationMs,
        timestamp: new Date().toISOString(),
        error: result.error
      }

    } catch (error) {
      const durationMs = Date.now() - startTime
      return {
        stepNumber: state.stepCount + 1,
        type: 'tool_result',
        toolName,
        toolCallId,
        arguments,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs,
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Detect if a tool is being called too many times
   */
  private detectRepeatedTool(state: AgentExecutionState, toolName: string): boolean {
    const recentCalls = state.history
      .filter(step => step.toolName === toolName)
      .slice(-this.config.maxSameToolRepetitions)

    return recentCalls.length >= this.config.maxSameToolRepetitions
  }

  /**
   * Build initial context for agent execution
   */
  private buildInitialContext(request: AgentExecutionRequest, state: AgentExecutionState): string {
    let context = `User Request: ${request.content}\n`
    context += `Mode: ${request.mode}\n`
    context += `Execution ID: ${state.executionId}\n`

    if (request.platformContext) {
      context += `\nPlatform context available.\n`
    }

    return context
  }

  /**
   * Append tool result to context
   */
  private appendToolResult(context: string, toolStep: AgentStep, state: AgentExecutionState): string {
    const resultText = toolStep.success
      ? `Tool ${toolStep.toolName} succeeded: ${JSON.stringify(toolStep.result)}`
      : `Tool ${toolStep.toolName} failed: ${toolStep.error}`

    return `${context}\n\n${resultText}`
  }

  /**
   * Format agent history for model context
   */
  private formatAgentHistory(history: AgentStep[]): string {
    // Keep only recent steps to respect token budget
    const recentHistory = history.slice(-5)
    return recentHistory
      .map(step => {
        if (step.type === 'tool_call') {
          return `Step ${step.stepNumber}: Called ${step.toolName} with ${JSON.stringify(step.arguments)}`
        } else if (step.type === 'tool_result') {
          return `Step ${step.stepNumber}: ${step.toolName} result: ${step.success ? 'success' : 'failed'}`
        } else {
          return `Step ${step.stepNumber}: ${step.type}`
        }
      })
      .join('\n')
  }

  /**
   * Build execution result
   */
  private buildResult(
    state: AgentExecutionState,
    error?: string,
    finalResponse?: string
  ): AgentExecutionResult {
    const durationMs = Date.now() - new Date(state.startedAt).getTime()

    return {
      status: state.status,
      finalResponse,
      executionId: state.executionId,
      stepCount: state.stepCount,
      toolCallCount: state.toolCallCount,
      durationMs,
      steps: state.history,
      error
    }
  }

  /**
   * Generate unique execution ID
   */
  private generateExecutionId(): string {
    return `agent_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * Generate unique tool call ID
   */
  private generateToolCallId(): string {
    return `tool_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * Log execution start to database
   */
  private async logExecutionStart(state: AgentExecutionState): Promise<void> {
    try {
      const { error } = await supabase
        .from('alex_agent_executions')
        .insert({
          execution_id: state.executionId,
          user_id: state.userId,
          conversation_id: state.conversationId,
          status: state.status,
          step_count: state.stepCount,
          tool_call_count: state.toolCallCount,
          started_at: state.startedAt,
          metadata: state.metadata
        })

      if (error) {
        console.error('[AgentService] Failed to log execution start:', error)
      }
    } catch (error) {
      console.error('[AgentService] Failed to log execution start:', error)
    }
  }

  /**
   * Update execution status in database
   */
  private async updateExecutionStatus(
    executionId: string,
    status: AgentExecutionStatus
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('alex_agent_executions')
        .update({
          status,
          completed_at: new Date().toISOString()
        })
        .eq('execution_id', executionId)

      if (error) {
        console.error('[AgentService] Failed to update execution status:', error)
      }
    } catch (error) {
      console.error('[AgentService] Failed to update execution status:', error)
    }
  }
}
